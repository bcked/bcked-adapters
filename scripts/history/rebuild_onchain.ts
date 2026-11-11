/**
 * Rebuilds daily on-chain history that does not depend on a third-party API:
 * - supply (totalSupply) of the tokens listed in supply/<token>.json, the same reads the crawler
 *   makes (src/crawler/adapters/circulating.ts and the asset adapters). Balances of `locked`
 *   addresses are not circulating. A `backing` entry also rebuilds the on-chain backing: a token
 *   balance held by a contract, the share of it that matches the circulating supply,
 * - the bitcoin held by the WBTC custodians, from Chainlink's WBTC Proof of Reserves feed,
 * - the backing of tokens whose entry names a Chainlink Proof of Reserves feed (`por`), whose
 *   backing is their own total supply (`pooled`) or the assets of a vault (`vault`),
 * - the price of tokens whose entry names a Chainlink price feed on its chain (`price`).
 *
 * Usage (in a records checkout as working directory, with ALCHEMY_API_KEY
 * set): bun <adapters>/scripts/history/rebuild_onchain.ts [<from> [<to>]]
 * SYSTEMS=<chain,...> limits the run to these chains, TOKENS=<file,...> to these files in supply/
 * (without .json). Days that already have a row are kept. REPLACE=1 overwrites the rows this script
 * wrote before (at the same timestamp), e.g. after a token's entry gained `locked` addresses. Reads
 * need archive nodes, which Alchemy provides. The official Base, Avalanche and Plume RPCs serve
 * archive reads too. A new token adds its own file in supply/ instead of editing this script.
 */
import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { blockNear as findBlock } from "./blocks";

const DAY = 24 * 60 * 60;
const RPC: Record<string, { url: string; chainId: number; perDay: number; start: number }> = {
    ethereum: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_API_KEY"]}`,
        chainId: 1,
        perDay: 7100,
        start: 7_000_000,
    },
    arbitrum: {
        url: `https://arb-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_API_KEY"]}`,
        chainId: 42161,
        perDay: 345_000,
        start: 1,
    },
    polygon: {
        url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_API_KEY"]}`,
        chainId: 137,
        perDay: 40_000,
        start: 1,
    },
    base: {
        url: "https://mainnet.base.org",
        chainId: 8453,
        perDay: 43_200,
        start: 1,
    },
    avalanche: {
        url: `https://avax-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_API_KEY"]}`,
        chainId: 43114,
        perDay: 80_000,
        start: 1,
    },
    plume: {
        url: "https://rpc.plume.org",
        chainId: 98866,
        perDay: 200_000,
        start: 1,
    },
    bsc: {
        url: `https://bnb-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_API_KEY"]}`,
        chainId: 56,
        perDay: 192_000,
        start: 1,
    },
    monad: {
        url: `https://monad-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_API_KEY"]}`,
        chainId: 143,
        perDay: 284_000,
        start: 1,
    },
    plasma: {
        url: `https://plasma-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_API_KEY"]}`,
        chainId: 9745,
        perDay: 86_000,
        start: 1,
    },
};

// Tokens whose daily supply is rebuilt: one file per token in supply/, a list of chain assets.
// locked: addresses whose balance is not circulating on the chain, e.g. a bridge's lock pool.
interface SupplyEntry {
    id: string;
    system: string;
    address: string;
    decimals: number;
    locked?: string[];
    // The token is backed by `token` held by `holder` on the same chain (asset id `id`, `decimals`).
    // The chain asset gets the share of it that matches its circulating supply. `bridged` names a
    // function of the token that returns the supply on other chains, which shares the same backing
    // (counted in the token's decimals). `assets` are the token on those chains: each gets the share
    // that matches its circulating supply on the same day. Days without a balance of `token` are
    // skipped.
    backing?: {
        id: string;
        token: string;
        holder: string;
        decimals: number;
        bridged?: string;
        assets?: string[];
    };
    // The backing is the answer of a Chainlink Proof of Reserves feed on the same chain, in units
    // of asset `id`.
    por?: { id: string; feed: string; decimals: number };
    // The backing is the token's own total supply, in units of asset `pooled`: stETH, whose supply
    // is the ETH pooled in Lido.
    pooled?: string;
    // The token is an ERC-4626 vault: the backing is its balance of `asset` (asset id `id`,
    // `decimals`), and the rest of totalAssets() is asset `rest`, e.g. loans for syrupUSDC.
    vault?: { asset: string; id: string; decimals: number; rest: string };
    // The price is the answer of a Chainlink USD feed on the same chain. It is written for this asset
    // and for `assets`, the token on other chains.
    price?: { feed: string; decimals: number; assets?: string[] };
}
const SUPPLY_DIR = path.join(import.meta.dir, "supply");
const TOKENS = process.env["TOKENS"] ? process.env["TOKENS"].split(",") : null;
const REPLACE = process.env["REPLACE"] == "1";
const SUPPLY: SupplyEntry[] = readdirSync(SUPPLY_DIR)
    .filter((file) => file.endsWith(".json"))
    .filter((file) => !TOKENS || TOKENS.includes(file.slice(0, -".json".length)))
    .sort()
    .flatMap(
        (file) => JSON.parse(readFileSync(path.join(SUPPLY_DIR, file), "utf8")) as SupplyEntry[]
    );
const WBTC = "ethereum:0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const WBTC_POR = "0xa81FE04086865e63E12dD3776978E49DEEa2ea4e";

const providers = Object.fromEntries(
    Object.entries(RPC).map(([system, rpc]) => [
        system,
        new JsonRpcProvider(rpc.url, rpc.chainId, { staticNetwork: true, batchMaxCount: 1 }),
    ])
);

/** Retries a read, except for a revert or missing contract (null: not deployed yet). */
async function read<T>(call: () => Promise<T>): Promise<T | null> {
    let last: unknown;
    for (const delay of [1000, 3000, 8000, 20000]) {
        try {
            return await call();
        } catch (error) {
            const code = (error as { code?: string }).code;
            if (code == "CALL_EXCEPTION" || code == "BAD_DATA") return null;
            last = error;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    const reason = last instanceof Error ? last.message : String(last);
    throw Error(`RPC reads keep failing, stopping without writing. Last error: ${reason}`);
}

const times = new Map<string, number>();
async function timeOf(system: string, block: number): Promise<number> {
    const key = `${system}:${block}`;
    if (!times.has(key))
        times.set(key, (await read(() => providers[system]!.getBlock(block)))!.timestamp);
    return times.get(key)!;
}

/** First block at or after a unix time. */
async function blockAt(system: string, unix: number, guess: number, latest: number) {
    const span = RPC[system]!.perDay;
    let low = Math.max(1, guess - span);
    let high = Math.min(latest, guess + span);
    while ((await timeOf(system, low)) > unix && low > 1) low = Math.max(1, low - span * 5);
    while ((await timeOf(system, high)) < unix && high < latest)
        high = Math.min(latest, high + span * 5);
    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if ((await timeOf(system, mid)) < unix) low = mid + 1;
        else high = mid;
    }
    return low;
}

/**
 * Merges rows by day into a CSV, keeping existing days. With REPLACE, a row at the same timestamp
 * (one this script wrote before) is overwritten.
 */
function merge(file: string, header: string[], rows: Map<string, string[]>) {
    mkdirSync(path.dirname(file), { recursive: true });
    const existing = new Map<string, string>();
    let columns = header;
    if (existsSync(file)) {
        const lines = readFileSync(file, "utf8").trim().split("\n");
        columns = lines[0]!.split(",");
        for (const line of lines.slice(1)) existing.set(line.split(",")[0]!, line);
    }
    const days = new Set([...existing.keys()].map((t) => t.slice(0, 10)));
    let added = 0;
    for (const [timestamp, values] of rows) {
        if (days.has(timestamp.slice(0, 10)) && !(REPLACE && existing.has(timestamp))) continue;
        const record: Record<string, string> = Object.fromEntries(
            header.map((h, i) => [h, values[i] ?? ""])
        );
        existing.set(
            timestamp,
            columns.map((c) => (c == "timestamp" ? timestamp : (record[c] ?? ""))).join(",")
        );
        added++;
    }
    const sorted = [...existing.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, line]) => line);
    writeFileSync(file, [columns.join(","), ...sorted].join("\n") + "\n");
    return added;
}

const from = Date.parse(`${process.argv[2] ?? "2019-01-01"}T00:00:00Z`) / 1000;
const to = process.argv[3]
    ? Date.parse(`${process.argv[3]}T00:00:00Z`) / 1000
    : Math.floor(Date.now() / 1000 / DAY) * DAY;

const supplies = new Map<string, Map<string, string[]>>();
const custody = new Map<string, string[]>();
const prices = new Map<string, Map<string, string[]>>();
const backings = new Map<string, { header: string[]; rows: Map<string, string[]> }>();
// Backing held on one chain for the token on other chains: per day the amount held and all supply.
const shared = new Map<
    string,
    { id: string; assets: string[]; days: Map<string, [number, number]> }
>();
// Days read at once. More gets throttled by the RPC provider, and the retries cost more than they save.
const PARALLEL_DAYS = Number(process.env["PARALLEL_DAYS"] ?? 4);
// SYSTEMS=base limits the run to some chains, e.g. to rebuild one without the Alchemy keys of the others.
// Empty (the workflow's default) means all chains.
const systems = process.env["SYSTEMS"] ? process.env["SYSTEMS"].split(",") : Object.keys(RPC);
for (const system of systems) {
    const latest = await providers[system]!.getBlockNumber();
    const first = await blockAt(system, from, RPC[system]!.start, latest);
    // A block within about a minute of the time (see blocks.ts).
    const blockNear = (day: number) =>
        findBlock((block) => timeOf(system, block), day, first, latest);

    const readDay = async (day: number) => {
        const block = await blockNear(day);
        const timestamp = new Date(day * 1000).toISOString();
        for (const token of SUPPLY.filter((s) => s.system == system)) {
            const supply = await read(
                () =>
                    new Contract(
                        token.address,
                        ["function totalSupply() view returns (uint256)"],
                        providers[system]
                    ).getFunction("totalSupply")({ blockTag: block }) as Promise<bigint>
            );
            if (supply === null || supply == 0n) continue;
            let locked = 0n;
            for (const holder of token.locked ?? []) {
                const balance = await read(
                    () =>
                        new Contract(
                            token.address,
                            ["function balanceOf(address) view returns (uint256)"],
                            providers[system]
                        ).getFunction("balanceOf")(holder, { blockTag: block }) as Promise<bigint>
                );
                if (balance === null) throw Error(`No balance of ${holder} at block ${block}.`);
                locked += balance;
            }
            const amount = formatUnits(supply, token.decimals);
            const circulating = formatUnits(supply - locked, token.decimals);
            if (!supplies.has(token.id)) supplies.set(token.id, new Map());
            // Same columns as the crawler: circulating, burned, issued, max, total.
            supplies
                .get(token.id)!
                .set(timestamp, [timestamp, "", circulating, amount, "", amount]);
            if (token.price) {
                const { feed, decimals, assets } = token.price;
                const round = await read(
                    () =>
                        new Contract(
                            feed,
                            [
                                "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
                            ],
                            providers[system]
                        ).getFunction("latestRoundData")({ blockTag: block }) as Promise<
                            [bigint, bigint, bigint, bigint, bigint]
                        >
                );
                if (round && round[1] > 0n)
                    for (const id of [token.id, ...(assets ?? [])])
                        (prices.get(id) ?? prices.set(id, new Map()).get(id)!).set(timestamp, [
                            timestamp,
                            formatUnits(round[1], decimals),
                        ]);
            }
            if (token.backing) {
                const { id, token: reserve, holder, decimals } = token.backing;
                const held = await read(
                    () =>
                        new Contract(
                            reserve,
                            ["function balanceOf(address) view returns (uint256)"],
                            providers[system]
                        ).getFunction("balanceOf")(holder, { blockTag: block }) as Promise<bigint>
                );
                if (held === null || held == 0n) continue;
                let all = supply;
                if (token.backing.bridged) {
                    const bridged = await read(
                        () =>
                            new Contract(
                                token.address,
                                [`function ${token.backing!.bridged} view returns (uint256)`],
                                providers[system]
                            ).getFunction(token.backing!.bridged!)({
                                blockTag: block,
                            }) as Promise<bigint>
                    );
                    if (bridged === null) continue;
                    all += bridged;
                }
                const share = formatUnits((held * (supply - locked)) / all, decimals);
                if (token.backing.assets) {
                    if (!shared.has(token.id))
                        shared.set(token.id, { id, assets: token.backing.assets, days: new Map() });
                    shared
                        .get(token.id)!
                        .days.set(timestamp, [
                            parseFloat(formatUnits(held, decimals)),
                            parseFloat(formatUnits(all, token.decimals)),
                        ]);
                }
                if (!backings.has(token.id))
                    backings.set(token.id, {
                        header: ["timestamp", `underlying.${id}`],
                        rows: new Map(),
                    });
                backings.get(token.id)!.rows.set(timestamp, [timestamp, share]);
            }
            if (token.por) {
                const { id, feed, decimals } = token.por;
                const round = await read(
                    () =>
                        new Contract(
                            feed,
                            [
                                "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
                            ],
                            providers[system]
                        ).getFunction("latestRoundData")({ blockTag: block }) as Promise<
                            [bigint, bigint, bigint, bigint, bigint]
                        >
                );
                if (round && round[1] > 0n) {
                    if (!backings.has(token.id))
                        backings.set(token.id, {
                            header: ["timestamp", `underlying.${id}`],
                            rows: new Map(),
                        });
                    backings
                        .get(token.id)!
                        .rows.set(timestamp, [timestamp, formatUnits(round[1], decimals)]);
                }
            }
            if (token.pooled) {
                if (!backings.has(token.id))
                    backings.set(token.id, {
                        header: ["timestamp", `underlying.${token.pooled}`],
                        rows: new Map(),
                    });
                backings.get(token.id)!.rows.set(timestamp, [timestamp, amount]);
            }
            if (token.vault) {
                const { asset, id, decimals, rest } = token.vault;
                const [cash, total] = await Promise.all([
                    read(
                        () =>
                            new Contract(
                                asset,
                                ["function balanceOf(address) view returns (uint256)"],
                                providers[system]
                            ).getFunction("balanceOf")(token.address, {
                                blockTag: block,
                            }) as Promise<bigint>
                    ),
                    read(
                        () =>
                            new Contract(
                                token.address,
                                ["function totalAssets() view returns (uint256)"],
                                providers[system]
                            ).getFunction("totalAssets")({ blockTag: block }) as Promise<bigint>
                    ),
                ]);
                if (cash !== null && total !== null) {
                    if (!backings.has(token.id))
                        backings.set(token.id, {
                            header: ["timestamp", `underlying.${id}`, `underlying.${rest}`],
                            rows: new Map(),
                        });
                    const other = total > cash ? total - cash : 0n;
                    backings
                        .get(token.id)!
                        .rows.set(timestamp, [
                            timestamp,
                            formatUnits(cash, decimals),
                            formatUnits(other, decimals),
                        ]);
                }
            }
        }
        if (system == "ethereum") {
            const round = await read(
                () =>
                    new Contract(
                        WBTC_POR,
                        [
                            "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
                        ],
                        providers[system]
                    ).getFunction("latestRoundData")({ blockTag: block }) as Promise<
                        [bigint, bigint, bigint, bigint, bigint]
                    >
            );
            if (round && round[1] > 0n)
                custody.set(timestamp, [timestamp, formatUnits(round[1], 8)]);
        }
    };

    const days: number[] = [];
    for (let day = from; day < to; day += DAY) days.push(day);
    for (let i = 0; i < days.length; i += PARALLEL_DAYS) {
        await Promise.all(days.slice(i, i + PARALLEL_DAYS).map(readDay));
        if (i % (PARALLEL_DAYS * 8) == 0)
            console.log(system, new Date(days[i]! * 1000).toISOString().slice(0, 10));
    }
}

for (const [id, rows] of supplies) {
    const added = merge(
        path.join("assets", id, "records", "supply.csv"),
        ["timestamp", "burned", "circulating", "issued", "max", "total"],
        rows
    );
    console.log(`${id}: ${added} supplies added`);
}
for (const [id, rows] of prices) {
    const added = merge(
        path.join("assets", id, "records", "price.csv"),
        ["timestamp", "usd"],
        rows
    );
    console.log(`${id}: ${added} prices added`);
}
for (const { id, assets, days } of shared.values())
    for (const asset of assets)
        for (const [timestamp, [held, all]] of days) {
            const circulating = supplies.get(asset)?.get(timestamp)?.[2];
            if (circulating === undefined) continue;
            if (!backings.has(asset))
                backings.set(asset, { header: ["timestamp", `underlying.${id}`], rows: new Map() });
            const share = (held * parseFloat(circulating)) / all;
            backings.get(asset)!.rows.set(timestamp, [timestamp, String(share)]);
        }
for (const [id, { header, rows }] of backings) {
    const added = merge(path.join("assets", id, "records", "backing.csv"), header, rows);
    console.log(`${id}: ${added} backing rows added`);
}
const added = merge(
    path.join("assets", WBTC, "records", "backing.csv"),
    ["timestamp", "underlying.bitcoin:BTC"],
    custody
);
console.log(`${WBTC}: ${added} custody rows added`);
