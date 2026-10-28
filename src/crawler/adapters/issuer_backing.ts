import path from "node:path";
import { FILES, PATHS } from "../../constants";
import { readCSV } from "../../utils/csv";
import { toISOString } from "../../utils/string_formatting";
import { DefiLlamaStablecoins, type ChainSupply } from "../apis/defillama_stablecoins";

/** Supply at the last day on or before the timestamp. */
function supplyAt(supply: ChainSupply[], timestamp: number): ChainSupply | null {
    let low = 0;
    let high = supply.length - 1;
    let found: ChainSupply | null = null;
    while (low <= high) {
        const mid = (low + high) >> 1;
        const point = supply[mid]!;
        if (point.timestamp <= timestamp) {
            found = point;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    // Only use supply data that is at most a few days older than the backing record.
    return found && timestamp - found.timestamp <= 3 * 24 * 60 * 60 * 1000 ? found : null;
}

/** USD value of the reserves held in USD-denominated assets (amounts of other assets are not in USD). */
function usdReserves(row: bcked.asset.Backing): number {
    return Object.entries(row.underlying)
        .filter(([asset]) => asset.startsWith("rwa:") && asset !== "rwa:XAU")
        .reduce((sum, [, value]) => sum + (typeof value === "number" ? value : 0), 0);
}

/**
 * Share of the chain in all tokens of the issuer. DefiLlama misses early history of some chains
 * (e.g. Omni for USDT), so its total can be far below the actual supply. The reserves cover all
 * tokens, so if the tracked total is below 90% of the USD reserves, the reserves are used instead.
 */
function chainShare(point: ChainSupply, row: bcked.asset.Backing): number {
    const reserves = usdReserves(row);
    const total = point.total < 0.9 * reserves ? reserves : point.total;
    return Math.min(1, point.chain / total);
}

/**
 * Backing of a token on one chain as its share of the issuer's reserves.
 *
 * Issuers like Tether and Circle report reserves for all chains together. The reserves are recorded
 * on the issuer entity (entities/<id>/records/backing.csv). The token's share is the chain's share of
 * the total circulating supply on that day, from DefiLlama (see chainShare).
 *
 * @param entityId Issuer entity holding the reserves
 * @param stablecoinId DefiLlama stablecoin ID
 * @param chain DefiLlama chain name
 * @param lastRecorded Latest backing already recorded for the token
 */
export async function getIssuerBackingShare(
    entityId: bcked.entity.Id,
    stablecoinId: number,
    chain: string,
    lastRecorded: bcked.asset.Backing | null
): Promise<bcked.asset.Backing[]> {
    const csvPath = path.join(PATHS.entities, entityId, PATHS.records, FILES.csv.backing);
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

    const supply = await new DefiLlamaStablecoins().getChainSupply(stablecoinId, chain);

    const backing: bcked.asset.Backing[] = [];
    for (const row of newReserves) {
        const point = supplyAt(supply, Date.parse(row.timestamp));
        if (point === null) continue;
        const share = chainShare(point, row);
        const underlying: Partial<Record<bcked.asset.Id, number>> = {};
        for (const asset of assets) {
            const value = row.underlying[asset];
            underlying[asset] = typeof value === "number" ? value * share : 0;
        }
        backing.push({ timestamp: toISOString(row.timestamp), underlying });
    }
    return backing;
}
