/**
 * Rebuilds the history of the native coins on the Kinesis ledgers, Kinesis Silver (KAG) and Kinesis
 * Gold (KAU):
 * - daily supply: the coins in circulation (minted less redeemed) at the start of each UTC day, from
 *   the dated records of the ledger's Horizon API (/coin_in_circulation). A record holds the
 *   circulation at the end of its day, so a day starts with the last record before it.
 * - backing: every round of the coin's Chainlink Proof of Reserves feed on Ethereum, one row per day
 *   (the day's last round), as the crawler records it. KAG's feed reports troy ounces of silver,
 *   KAU's feed grams of gold, which are converted to troy ounces.
 *
 * KAG and KAU on Ethereum are rebuilt by rebuild_onchain.ts (supply/kag.json, supply/kau.json).
 *
 * Usage (in a records checkout as working directory, with ALCHEMY_ETHEREUM or ETHEREUM_RPC set):
 *   bun <adapters>/scripts/history/kinesis.ts [KAG|KAU ...]
 * Without arguments both coins are rebuilt. Days that already have a row are kept.
 */
import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { KAG_POR } from "../../assets/kinesis:KAG/index";
import { GRAMS_PER_TROY_OUNCE, KAU_POR } from "../../assets/kinesis:KAU/index";
import { KINESIS_HORIZON, type Circulation } from "../../src/crawler/chains/kinesis";

const DAY = 24 * 60 * 60 * 1000;

interface Coin {
    /** Chainlink Proof of Reserves feed on Ethereum. */
    por: string;
    /** The backing asset and the factor from the feed's unit to its unit. */
    underlying: string;
    perUnit: number;
}

const COINS: Record<string, Coin> = {
    KAG: { por: KAG_POR, underlying: "rwa:XAG", perUnit: 1 },
    KAU: { por: KAU_POR, underlying: "rwa:XAU", perUnit: 1 / GRAMS_PER_TROY_OUNCE },
};

/** Merges rows by day into a CSV, keeping existing days. */
function merge(file: string, header: string[], rows: Map<string, string[]>): number {
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
        const record = Object.fromEntries(header.map((h, i) => [h, values[i] ?? ""]));
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

async function supply(coin: string): Promise<Map<string, string[]>> {
    const response = await fetch(
        `${KINESIS_HORIZON[coin]}/coin_in_circulation?from=2019-01-01T00:00:00.000Z`
    );
    if (!response.ok) throw Error(`Horizon returned ${response.status}.`);
    const { records } = (await response.json()) as {
        records: (Omit<Circulation, "last_ledger_timestamp" | "last_ledger"> & { date: string })[];
    };
    records.sort((a, b) => a.date.localeCompare(b.date));
    const rows = new Map<string, string[]>();
    const today = Math.floor(Date.now() / DAY) * DAY;
    let next = 0;
    let circulation: string | undefined;
    for (let day = Date.parse(records[0]!.date) + DAY; day <= today; day += DAY) {
        while (next < records.length && Date.parse(records[next]!.date) < day)
            circulation = String(Number(records[next++]!.circulation));
        const timestamp = new Date(day).toISOString();
        // Same columns as the crawler: circulating, burned, issued, max, total.
        rows.set(timestamp, [timestamp, "", "", circulation!, "", circulation!]);
    }
    return rows;
}

async function backing(coin: string, { por, perUnit }: Coin): Promise<Map<string, string[]>> {
    const provider = new JsonRpcProvider(
        process.env["ETHEREUM_RPC"] ??
            `https://eth-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_ETHEREUM"]}`,
        1,
        { staticNetwork: true, batchMaxCount: 1 }
    );
    const proxy = new Contract(
        por,
        [
            "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
            "function getRoundData(uint80) view returns (uint80, int256, uint256, uint256, uint80)",
            "function phaseAggregators(uint16) view returns (address)",
        ],
        provider
    );
    const [latestRound] = (await proxy.getFunction("latestRoundData")()) as [bigint];
    const currentPhase = Number(latestRound >> 64n);
    const byDay = new Map<string, [number, string]>();
    for (let phase = 1; phase <= currentPhase; phase++) {
        const aggregator = (await proxy.getFunction("phaseAggregators")(phase)) as string;
        const last =
            phase == currentPhase
                ? latestRound & ((1n << 64n) - 1n)
                : ((await new Contract(
                      aggregator,
                      ["function latestRound() view returns (uint256)"],
                      provider
                  ).getFunction("latestRound")()) as bigint);
        const ids = Array.from(
            { length: Number(last) },
            (_, i) => (BigInt(phase) << 64n) | BigInt(i + 1)
        );
        for (let i = 0; i < ids.length; i += 10) {
            const rounds = await Promise.all(
                ids.slice(i, i + 10).map(
                    (id) =>
                        proxy
                            .getFunction("getRoundData")(id)
                            .catch(() => null) as Promise<
                            [bigint, bigint, bigint, bigint, bigint] | null
                        >
                )
            );
            for (const round of rounds) {
                if (!round || round[1] <= 0n || round[3] == 0n) continue;
                const time = Number(round[3]) * 1000;
                const day = new Date(time).toISOString().slice(0, 10);
                if ((byDay.get(day)?.[0] ?? 0) <= time)
                    byDay.set(day, [time, String(parseFloat(formatUnits(round[1], 18)) * perUnit)]);
            }
        }
        console.log(`${coin} Proof of Reserves phase ${phase}: ${last} rounds`);
    }
    const rows = new Map<string, string[]>();
    for (const [time, ounces] of byDay.values()) {
        const timestamp = new Date(time).toISOString();
        rows.set(timestamp, [timestamp, ounces]);
    }
    return rows;
}

const coins = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(COINS);
for (const coin of coins) {
    const config = COINS[coin];
    if (!config) throw Error(`Unknown Kinesis coin ${coin}.`);
    const asset = `kinesis:${coin}`;
    const supplies = await supply(coin);
    console.log(
        `${asset}: ${merge(
            path.join("assets", asset, "records", "supply.csv"),
            ["timestamp", "burned", "circulating", "issued", "max", "total"],
            supplies
        )} supplies added`
    );
    const backings = await backing(coin, config);
    console.log(
        `${asset}: ${merge(
            path.join("assets", asset, "records", "backing.csv"),
            ["timestamp", `underlying.${config.underlying}`],
            backings
        )} backing rows added`
    );
}
