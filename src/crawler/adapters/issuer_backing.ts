import { existsSync } from "node:fs";
import path from "node:path";
import { FILES, PATHS } from "../../constants";
import { readCSV } from "../../utils/csv";
import { toISOString } from "../../utils/string_formatting";

const DAY = 24 * 60 * 60 * 1000;
// A supply point counts for a report if it is at most this far from the report time.
const MAX_DISTANCE = 3 * DAY;

interface Point {
    timestamp: number;
    values: Record<string, number>;
}

/** Numeric columns of a CSV with a timestamp column, oldest first. Empty if the file is missing. */
async function readPoints(csvPath: string): Promise<Point[]> {
    if (!existsSync(csvPath)) return [];
    const points: Point[] = [];
    for await (const row of readCSV<Record<string, unknown>>(csvPath)) {
        const values: Record<string, number> = {};
        for (const [key, value] of Object.entries(row))
            if (key != "timestamp" && typeof value === "number") values[key] = value;
        points.push({ timestamp: Date.parse(String(row["timestamp"])), values });
    }
    return points.sort((a, b) => a.timestamp - b.timestamp);
}

/** The value of a column at the point closest to a time, within MAX_DISTANCE. */
function closest(points: Point[], time: number, column: string): number | undefined {
    let best: Point | undefined;
    for (const point of points) {
        if (point.values[column] === undefined) continue;
        if (!best || Math.abs(point.timestamp - time) < Math.abs(best.timestamp - time))
            best = point;
    }
    return best && Math.abs(best.timestamp - time) <= MAX_DISTANCE
        ? best.values[column]
        : undefined;
}

/**
 * Backing of a token on one chain as its share of the token's reserves.
 *
 * Issuers like Tether, Circle and Paxos report reserves for all chains together. The reserves are
 * recorded on the token (tokens/<id>/records/backing.csv). The chain's share is its circulating
 * supply over the token's total at the report time:
 * - The total is the tokens outstanding from the token's supply records
 *   (tokens/<id>/records/supply.csv): from the reports, or for USDT from Tether's daily figures.
 * - The chain's supply is the chain asset's own supply records. A chain count in the token's supply
 *   records (from a report) takes precedence.
 * Report dates without both are skipped.
 *
 * @param tokenId Token holding the reserves of all chains
 * @param assetId The chain asset, e.g. "tron:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
 * @param chain Column name of the chain in the token's supply records, e.g. "Ethereum"
 * @param lastRecorded Latest backing already recorded for the chain asset
 */
export async function getTokenBackingShare(
    tokenId: bcked.token.Id,
    assetId: bcked.asset.Id,
    chain: string,
    lastRecorded: bcked.asset.Backing | null
): Promise<bcked.asset.Backing[]> {
    const csvPath = path.join(PATHS.tokens, tokenId, PATHS.records, FILES.csv.backing);
    const reserves: bcked.asset.Backing[] = [];
    for await (const row of readCSV<bcked.asset.Backing>(csvPath)) reserves.push(row);

    const newReserves = reserves.filter(
        (row) => !lastRecorded || Date.parse(row.timestamp) > Date.parse(lastRecorded.timestamp)
    );
    if (!newReserves.length) return [];

    // All rows get the same underlying assets, because the CSV header is taken from the first row.
    const assets = [
        ...new Set(reserves.flatMap((row) => Object.keys(row.underlying))),
    ] as bcked.asset.Id[];

    const [tokenSupply, chainSupply] = await Promise.all([
        readPoints(path.join(PATHS.tokens, tokenId, PATHS.records, FILES.csv.supply)),
        readPoints(path.join(PATHS.assets, assetId, PATHS.records, FILES.csv.supply)),
    ]);

    const backing: bcked.asset.Backing[] = [];
    for (const row of newReserves) {
        const time = Date.parse(row.timestamp);
        const total = closest(tokenSupply, time, "total");
        const onChain =
            closest(tokenSupply, time, chain) ??
            closest(chainSupply, time, "circulating") ??
            closest(chainSupply, time, "issued");
        if (!total || onChain === undefined) {
            console.log(`${assetId}: no supply for the report of ${row.timestamp}, skipped`);
            continue;
        }
        const share = Math.min(1, onChain / total);
        const underlying: Partial<Record<bcked.asset.Id, number>> = {};
        for (const asset of assets) {
            const value = row.underlying[asset];
            underlying[asset] = typeof value === "number" ? value * share : 0;
        }
        backing.push({ timestamp: toISOString(row.timestamp), underlying });
    }
    return backing;
}
