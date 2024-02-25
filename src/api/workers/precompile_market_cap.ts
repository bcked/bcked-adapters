import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";

import { hoursToMilliseconds } from "date-fns";
import { existsSync } from "fs";
import path from "path";
import { ConsecutiveLookup, readCSV, writeToCsv } from "../../utils/csv";
import { remove } from "../../utils/files";
import { round } from "../../utils/math";

async function* match(
    id: bcked.asset.Id,
    window: number = hoursToMilliseconds(12)
): AsyncIterableIterator<bcked.asset.MarketCap> {
    const supplyCsv = path.join(PATHS.assets, id, "records", "supply_amount.csv");
    const priceCsv = path.join(PATHS.assets, id, "records", "price.csv");

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

parentPort?.on("message", async (id: bcked.asset.Id) => {
    console.log(`Precompiling market cap for asset ${id}`);
    const filePath = path.join(PATHS.assets, id, "records", "market_cap.csv");
    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await remove(filePath);

        const entries = match(id);
        await writeToCsv(filePath, entries, "timestamp");

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.assets}/${id}`, error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
