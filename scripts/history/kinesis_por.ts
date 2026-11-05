/**
 * Rebuilds the backing history of Kinesis Gold (KAU) on the Kinesis blockchain from Chainlink's KAU
 * Proof of Reserves feed on Ethereum: every round of the feed, one row per day (the day's last
 * round), as the crawler records it. The feed reports grams of gold, which are converted to troy
 * ounces (rwa:XAU).
 *
 * KAU on Ethereum is rebuilt by rebuild_onchain.ts (supply/kau.json).
 *
 * Usage (in a records checkout as working directory, with ALCHEMY_ETHEREUM or ETHEREUM_RPC set):
 *   bun <adapters>/scripts/history/kinesis_por.ts
 * Days that already have a row are kept.
 */
import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { GRAMS_PER_TROY_OUNCE, KAU_POR } from "../../assets/kinesis:KAU/index";

interface Coin {
    /** Chainlink Proof of Reserves feed on Ethereum. */
    por: string;
    /** The backing asset and the factor from the feed's unit to its unit. */
    underlying: string;
    perUnit: number;
}

const COINS: Record<string, Coin> = {
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

for (const [coin, config] of Object.entries(COINS)) {
    const asset = `kinesis:${coin}`;
    const backings = await backing(coin, config);
    console.log(
        `${asset}: ${merge(
            path.join("assets", asset, "records", "backing.csv"),
            ["timestamp", `underlying.${config.underlying}`],
            backings
        )} backing rows added`
    );
}
