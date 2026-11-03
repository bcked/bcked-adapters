/**
 * Rebuilds daily on-chain history that does not depend on a third-party API:
 * - supply (totalSupply) of USDC on Ethereum, Arbitrum, Polygon and Base, PYUSD and USDG on Ethereum,
 *   EURC on Ethereum and Base,
 *   the same reads the crawler makes (src/crawler/adapters/circulating.ts),
 * - the bitcoin held by the WBTC custodians, from Chainlink's WBTC Proof of Reserves feed.
 *
 * Usage (in a records checkout as working directory, with ALCHEMY_ETHEREUM, ALCHEMY_ARBITRUM and
 * ALCHEMY_POLYGON set): bun <adapters>/scripts/history/rebuild_onchain.ts [<from> [<to>]]
 * SYSTEMS=<chain,...> limits the run to these chains. Days that already have a row are kept. Reads need archive nodes, which Alchemy provides. The
 * official Base RPC serves archive reads too.
 */
import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DAY = 24 * 60 * 60;
const RPC: Record<string, { url: string; chainId: number; perDay: number; start: number }> = {
    ethereum: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_ETHEREUM"]}`,
        chainId: 1,
        perDay: 7100,
        start: 7_000_000,
    },
    arbitrum: {
        url: `https://arb-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_ARBITRUM"]}`,
        chainId: 42161,
        perDay: 345_000,
        start: 1,
    },
    polygon: {
        url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_POLYGON"]}`,
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
};

const SUPPLY: { id: string; system: string; address: string; decimals: number }[] = [
    {
        id: "ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        system: "ethereum",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6,
    },
    {
        id: "arbitrum:0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        system: "arbitrum",
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        decimals: 6,
    },
    {
        id: "polygon:0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        system: "polygon",
        address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        decimals: 6,
    },
    {
        id: "base:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        system: "base",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        decimals: 6,
    },
    {
        id: "ethereum:0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
        system: "ethereum",
        address: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
        decimals: 6,
    },
    {
        id: "ethereum:0xe343167631d89B6Ffc58B88d6b7fB0228795491D",
        system: "ethereum",
        address: "0xe343167631d89B6Ffc58B88d6b7fB0228795491D",
        decimals: 6,
    },
    {
        id: "ethereum:0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
        system: "ethereum",
        address: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
        decimals: 6,
    },
    {
        id: "base:0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
        system: "base",
        address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
        decimals: 6,
    },
];
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
    for (const delay of [1000, 3000, 8000, 20000]) {
        try {
            return await call();
        } catch (error) {
            const code = (error as { code?: string }).code;
            if (code == "CALL_EXCEPTION" || code == "BAD_DATA") return null;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw Error("RPC reads keep failing, stopping without writing.");
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

/** Merges rows by day into a CSV, keeping existing days. */
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
        if (days.has(timestamp.slice(0, 10))) continue;
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
// Days read at once. More gets throttled by the RPC provider, and the retries cost more than they save.
const PARALLEL_DAYS = Number(process.env["PARALLEL_DAYS"] ?? 4);
// SYSTEMS=base limits the run to some chains, e.g. to rebuild one without the Alchemy keys of the others.
const systems = process.env["SYSTEMS"]?.split(",") ?? Object.keys(RPC);
for (const system of systems) {
    const latest = await providers[system]!.getBlockNumber();
    const first = await blockAt(system, from, RPC[system]!.start, latest);
    const now = await timeOf(system, latest);
    const guessFor = (day: number) =>
        Math.round(first + ((day - from) * (latest - first)) / Math.max(1, now - from));

    const secondsPerBlock = (now - (await timeOf(system, first))) / Math.max(1, latest - first);
    // A block close to the time (within about a minute), in a few steps from the guess.
    const blockNear = async (day: number) => {
        let block = Math.min(latest, Math.max(first, guessFor(day)));
        for (let step = 0; step < 4; step++) {
            const offset = Math.round((day - (await timeOf(system, block))) / secondsPerBlock);
            if (Math.abs(offset) * secondsPerBlock <= 60) break;
            block = Math.min(latest, Math.max(1, block + offset));
        }
        return block;
    };

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
            const amount = formatUnits(supply, token.decimals);
            if (!supplies.has(token.id)) supplies.set(token.id, new Map());
            // Same columns as the crawler: circulating, burned, issued, max, total.
            supplies.get(token.id)!.set(timestamp, [timestamp, "", amount, amount, "", amount]);
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
const added = merge(
    path.join("assets", WBTC, "records", "backing.csv"),
    ["timestamp", "underlying.bitcoin:BTC"],
    custody
);
console.log(`${WBTC}: ${added} custody rows added`);
