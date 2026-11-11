/**
 * Rebuilds the daily price history of every asset priced by Chainlink (src/crawler/apis/chainlink.ts),
 * from the feed contracts at a block near the start of each UTC day: on Ethereum, and on the other
 * chains a feed is on (`chain` in FEEDS, e.g. Arbitrum, BNB Chain), at that chain's block for the
 * day. Feeds on other chains can also be rebuilt by rebuild_onchain.ts (`price` in
 * supply/<token>.json).
 *
 * Usage (in a records checkout as working directory, with ALCHEMY_API_KEY or ETHEREUM_RPC set):
 *   bun <adapters>/scripts/history/rebuild_prices.ts [<from YYYY-MM-DD> [<to YYYY-MM-DD>]]
 *
 * Days before a feed existed have no row. Existing rows of a day are kept, so the script can run
 * again. FEEDS=<name,...> limits the run to these feeds (names in FEEDS of chainlink.ts), e.g. to
 * rebuild one feed after its rows were removed. Reads need an archive node, which Alchemy provides.
 */
import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { blockNear as findBlock } from "./blocks";

import { FEEDS, PRICE_SOURCES, WEETH, feedChain } from "../../src/crawler/apis/chainlink";

const DAY = 24 * 60 * 60;
const provider = new JsonRpcProvider(
    process.env["ETHEREUM_RPC"] ??
        `https://eth-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_API_KEY"]}`,
    1,
    { staticNetwork: true, batchMaxCount: 1 }
);

/** Retries a read on errors other than a missing contract or a revert (the feed did not exist yet). */
async function read<T>(call: () => Promise<T>): Promise<T | null> {
    for (const delay of [1000, 3000, 8000, 20000]) {
        try {
            return await call();
        } catch (error) {
            // A revert, or empty data from an address without code: the feed did not exist yet.
            const code = (error as { code?: string }).code;
            if (code == "CALL_EXCEPTION" || code == "BAD_DATA") return null;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw Error("RPC reads keep failing, stopping without writing.");
}
const LATEST = [
    "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
];
const WSTETH = new Contract(
    "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    ["function stEthPerToken() view returns (uint256)"],
    provider
);
const WEETH_CONTRACT = new Contract(WEETH, ["function getRate() view returns (uint256)"], provider);

const blockTimes = new Map<number, number>();
async function timeOf(block: number): Promise<number> {
    if (!blockTimes.has(block)) {
        const found = await read(() => provider.getBlock(block));
        blockTimes.set(block, found!.timestamp);
    }
    return blockTimes.get(block)!;
}

/** First block at or after a unix time, searching from a guess. */
async function blockAt(unix: number, guess: number, latest: number): Promise<number> {
    let low = Math.max(1, guess - 4000);
    let high = Math.min(latest, guess + 4000);
    while ((await timeOf(low)) > unix && low > 1) low = Math.max(1, low - 20000);
    while ((await timeOf(high)) < unix && high < latest) high = Math.min(latest, high + 20000);
    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if ((await timeOf(mid)) < unix) low = mid + 1;
        else high = mid;
    }
    return low;
}

// Alchemy endpoints of the other chains with feeds.
const OTHER_RPC: Record<string, { url: string; chainId: number }> = {
    arbitrum: { url: "https://arb-mainnet.g.alchemy.com/v2/", chainId: 42161 },
    bsc: { url: "https://bnb-mainnet.g.alchemy.com/v2/", chainId: 56 },
};

/** Finds a block near a time on another chain, by interpolation and a few steps. */
class OtherChain {
    provider: JsonRpcProvider;
    times = new Map<number, number>();
    latest = 0;

    constructor(system: string) {
        const rpc = OTHER_RPC[system];
        if (!rpc) throw Error(`No archive RPC for feeds on ${system}`);
        this.provider = new JsonRpcProvider(
            `${rpc.url}${process.env["ALCHEMY_API_KEY"]!}`,
            rpc.chainId,
            {
                staticNetwork: true,
                batchMaxCount: 1,
            }
        );
    }

    async timeOf(block: number): Promise<number> {
        if (!this.times.has(block)) {
            const found = await read(() => this.provider.getBlock(block));
            this.times.set(block, found!.timestamp);
        }
        return this.times.get(block)!;
    }

    async init() {
        this.latest = await this.provider.getBlockNumber();
    }

    /** A block within about a minute of the time, or null before the chain existed. */
    async blockNear(day: number): Promise<number | null> {
        const genesis = await this.timeOf(1);
        if (day < genesis) return null;
        return findBlock((block) => this.timeOf(block), day, 1, this.latest);
    }
}

// FEEDS=TRX limits the run to the prices of some feeds. Empty (the workflow's default) means all
// feeds. The feeds these prices are multiplied with (`times`, e.g. ETH for frxETH) are read too.
const ONLY = process.env["FEEDS"] ? new Set(process.env["FEEDS"].split(",")) : null;
const NEEDED = ONLY
    ? new Set([
          ...ONLY,
          ...Object.values(PRICE_SOURCES)
              .filter((source) => ONLY.has(source.feed) && source.times && source.times != "wstETH")
              .map((source) => source.times as string),
      ])
    : null;
const included = (name: string) => !NEEDED || NEEDED.has(name);

// Days before which a feed's answers are not used. The syrupUSDC-USDC feed on Arbitrum answered
// a tenth of the exchange rate (about 0.1116 at 18 decimals) until its update of 2025-08-11.
const FEED_START: Partial<Record<keyof typeof FEEDS, string>> = {
    SYRUPUSDC_USDC: "2025-08-12",
};

const otherChains = new Map<string, OtherChain>();
for (const name of (Object.keys(FEEDS) as (keyof typeof FEEDS)[]).filter(included)) {
    const system = feedChain(name);
    if (system != "ethereum" && !otherChains.has(system))
        otherChains.set(system, new OtherChain(system));
}
for (const chain of otherChains.values()) await chain.init();

/** Answers of the feeds on other chains, at each chain's block for the day. */
async function otherFeedsAt(day: number): Promise<Partial<Record<keyof typeof FEEDS, number>>> {
    const result: Partial<Record<keyof typeof FEEDS, number>> = {};
    for (const [system, chain] of otherChains) {
        const block = await chain.blockNear(day);
        if (block === null) continue;
        for (const [name, feed] of Object.entries(FEEDS)) {
            if (feedChain(name as keyof typeof FEEDS) != system || !included(name)) continue;
            const round = await read(
                () =>
                    new Contract(feed.address, LATEST, chain.provider).getFunction(
                        "latestRoundData"
                    )({ blockTag: block }) as Promise<[bigint, bigint, bigint, bigint, bigint]>
            );
            if (!round) continue;
            const value = parseFloat(formatUnits(round[1], feed.decimals));
            if (value > 0) result[name as keyof typeof FEEDS] = value;
        }
    }
    return result;
}

async function feedsAt(block: number): Promise<Partial<Record<keyof typeof FEEDS, number>>> {
    const entries = await Promise.all(
        Object.entries(FEEDS)
            .filter(
                ([name]) => feedChain(name as keyof typeof FEEDS) == "ethereum" && included(name)
            )
            .map(async ([name, feed]) => {
                const round = await read(
                    () =>
                        new Contract(feed.address, LATEST, provider).getFunction("latestRoundData")(
                            {
                                blockTag: block,
                            }
                        ) as Promise<[bigint, bigint, bigint, bigint, bigint]>
                );
                if (!round) return null;
                const usd = parseFloat(formatUnits(round[1], feed.decimals));
                return usd > 0 ? [name, usd] : null;
            })
    );
    return Object.fromEntries(entries.filter((entry) => entry !== null));
}

function readRows(file: string): Map<string, string> {
    const rows = new Map<string, string>();
    if (!existsSync(file)) return rows;
    for (const line of readFileSync(file, "utf8").trim().split("\n").slice(1)) {
        const [timestamp, usd] = line.split(",");
        if (timestamp && usd) rows.set(timestamp, usd);
    }
    return rows;
}

const from = Date.parse(`${process.argv[2] ?? "2019-01-01"}T00:00:00Z`) / 1000;
const today = process.argv[3]
    ? Date.parse(`${process.argv[3]}T00:00:00Z`) / 1000
    : Math.floor(Date.now() / 1000 / DAY) * DAY;
const latest = await provider.getBlockNumber();
const prices: Record<string, Map<string, number>> = {};

const first = await blockAt(from, 7_000_000, latest);

/**
 * A block close to a time (within about a minute, see blocks.ts). A daily price does not need the
 * exact first block of the day.
 */
async function blockNear(day: number): Promise<number> {
    return findBlock(timeOf, day, first, latest);
}

async function priceDay(day: number) {
    const block = await blockNear(day);
    const feeds = { ...(await feedsAt(block)), ...(await otherFeedsAt(day)) };
    if (!Object.keys(feeds).length) return;
    const rawRate =
        feeds.STETH !== undefined
            ? await read(
                  () => WSTETH.getFunction("stEthPerToken")({ blockTag: block }) as Promise<bigint>
              )
            : null;
    const rate = rawRate === null ? undefined : parseFloat(formatUnits(rawRate, 18));
    const rawWeEthRate =
        feeds.WEETH_ETH !== undefined
            ? await read(
                  () =>
                      WEETH_CONTRACT.getFunction("getRate")({ blockTag: block }) as Promise<bigint>
              )
            : null;
    const weEthRate = rawWeEthRate === null ? undefined : parseFloat(formatUnits(rawWeEthRate, 18));
    const timestamp = new Date(day * 1000).toISOString();
    for (const [id, source] of Object.entries(PRICE_SOURCES)) {
        if (ONLY && !ONLY.has(source.feed)) continue;
        if (timestamp.slice(0, 10) < (FEED_START[source.feed] ?? "")) continue;
        const base = feeds[source.feed];
        if (base === undefined) continue;
        const factor =
            source.times === undefined ? 1 : source.times == "wstETH" ? rate : feeds[source.times];
        if (factor === undefined) continue;
        const divisor = source.per == "weETH" ? weEthRate : 1;
        if (!divisor) continue;
        (prices[id] ??= new Map()).set(timestamp, (base * factor) / divisor);
    }
}

// Several days at once, each with its own reads.
// Days read at once. More gets throttled by the RPC provider, and the retries cost more than they save.
const PARALLEL_DAYS = Number(process.env["PARALLEL_DAYS"] ?? 4);
const days: number[] = [];
for (let day = from; day < today; day += DAY) days.push(day);
for (let i = 0; i < days.length; i += PARALLEL_DAYS) {
    await Promise.all(days.slice(i, i + PARALLEL_DAYS).map(priceDay));
    if (i % (PARALLEL_DAYS * 8) == 0)
        console.log(new Date(days[i]! * 1000).toISOString().slice(0, 10));
}

for (const [id, series] of Object.entries(prices)) {
    const dir = path.join("assets", id, "records");
    const file = path.join(dir, "price.csv");
    mkdirSync(dir, { recursive: true });
    const rows = readRows(file);
    const days = new Set([...rows.keys()].map((timestamp) => timestamp.slice(0, 10)));
    let added = 0;
    for (const [timestamp, usd] of series)
        if (!days.has(timestamp.slice(0, 10))) {
            rows.set(timestamp, String(usd));
            added++;
        }
    const sorted = [...rows.entries()].sort(([a], [b]) => a.localeCompare(b));
    writeFileSync(
        file,
        ["timestamp,usd", ...sorted.map(([t, u]) => `${t},${u}`)].join("\n") + "\n"
    );
    console.log(`${id}: ${added} prices added`);
}
