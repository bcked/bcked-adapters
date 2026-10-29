import { parentPort } from "worker_threads";
import { FILES, PATHS } from "../../constants";
import { sendErrorReport } from "../../watcher/bot";

import { hoursToMilliseconds } from "date-fns";
import { existsSync } from "fs";
import path from "path";
import { ConsecutiveLookup, LatestLookup, readCSV, writeToCsv } from "../../utils/csv";
import { remove } from "../../utils/files";
import { round } from "../../utils/math";
import { daysInMs } from "../../utils/time";

async function* match(
    id: bcked.asset.Id,
    window: number = hoursToMilliseconds(12)
): AsyncIterableIterator<bcked.asset.MarketCap> {
    const supplyCsv = path.join(PATHS.assets, id, PATHS.records, FILES.csv.supplyAmount);
    const priceCsv = path.join(PATHS.assets, id, PATHS.records, FILES.csv.price);

    if (!existsSync(supplyCsv) || !existsSync(priceCsv)) return;

    const supplyEntries = readCSV<bcked.asset.SupplyAmount>(supplyCsv);

    const priceLookup = new ConsecutiveLookup<bcked.asset.Price>(priceCsv);

    for await (const supplyEntry of supplyEntries) {
        // Get closest prices to the current entry for all underlying assets

        const price = await priceLookup.getClosest(supplyEntry.timestamp, window);

        if (!price) continue;

        yield {
            timestamp: supplyEntry.timestamp,
            price: price,
            supply: supplyEntry,
            usd: round(price.usd * supplyEntry.amount, 2),
        };
    }
}

/** Supply of real-world assets is published yearly (gold) or monthly (US dollar). */
const MAX_RWA_SUPPLY_AGE = daysInMs(2 * 365);

/**
 * Market cap of a real-world asset at every price and supply record, from the latest supply and
 * price at that time. Supply changes slowly and is recorded rarely, so it is not matched within a
 * few hours like token supply. A price with a single record is constant (US dollar).
 */
async function* matchRealWorldAsset(
    id: bcked.asset.Id
): AsyncIterableIterator<bcked.asset.MarketCap> {
    const supplyCsv = path.join(PATHS.assets, id, PATHS.records, FILES.csv.supplyAmount);
    const priceCsv = path.join(PATHS.assets, id, PATHS.records, FILES.csv.price);

    if (!existsSync(supplyCsv) || !existsSync(priceCsv)) return;

    const timestamps = new Set<string>();
    let priceCount = 0;
    for await (const { timestamp } of readCSV<bcked.asset.Price>(priceCsv)) {
        timestamps.add(timestamp);
        priceCount++;
    }
    for await (const { timestamp } of readCSV<bcked.asset.SupplyAmount>(supplyCsv))
        timestamps.add(timestamp);

    const supplyLookup = new LatestLookup<bcked.asset.SupplyAmount>(supplyCsv);
    const priceLookup = new LatestLookup<bcked.asset.Price>(priceCsv);
    const maxPriceAge = priceCount == 1 ? Infinity : MAX_RWA_SUPPLY_AGE;

    for (const timestamp of [...timestamps].sort()) {
        const supply = await supplyLookup.getLatest(timestamp, MAX_RWA_SUPPLY_AGE);
        const price = await priceLookup.getLatest(timestamp, maxPriceAge);
        if (!supply || !price) continue;

        yield {
            timestamp: timestamp as bcked.asset.MarketCap["timestamp"],
            price,
            supply,
            usd: round(price.usd * supply.amount, 2),
        };
    }
}

parentPort?.on("message", async (id: bcked.asset.Id) => {
    console.log(`Precompiling market cap for asset ${id}`);
    const filePath = path.join(PATHS.assets, id, PATHS.records, FILES.csv.marketCap);
    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await remove(filePath);

        const entries = id.startsWith("rwa:") ? matchRealWorldAsset(id) : match(id);
        await writeToCsv(filePath, entries, "timestamp");

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.assets}/${id}`, error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
