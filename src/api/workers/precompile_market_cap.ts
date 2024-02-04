import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";

import { hoursToMilliseconds } from "date-fns";
import { existsSync } from "fs";
import { unlink } from "fs/promises";
import path from "path";
import { readCSV, writeToCsv } from "../../utils/csv";
import { ConsecutivePriceLookup } from "../utils/priceLookup";

const ASSETS_PATH = "assets";

async function* matchSupplyAndPrice(
    id: bcked.asset.Id,
    window: number = hoursToMilliseconds(12)
): AsyncIterableIterator<bcked.asset.MarketCap> {
    const supplyCsv = path.join(ASSETS_PATH, id, "records", "supply_amount.csv");

    if (!existsSync(supplyCsv)) return;

    const supplyEntries = readCSV<bcked.asset.SupplyAmount>(supplyCsv);

    let priceLookup = new ConsecutivePriceLookup(id);

    for await (const supplyEntry of supplyEntries) {
        // Get closest prices to the current entry for all underlying assets

        const price = await priceLookup.getClosest(supplyEntry.timestamp, window);

        if (!price) continue;

        yield {
            timestamp: supplyEntry.timestamp,
            price: price,
            supply: supplyEntry,
            usd: price.usd * supplyEntry.amount,
        };
    }
}

parentPort?.on("message", async (id: bcked.asset.Id) => {
    console.log(`Precompiling market cap for asset ${id}`);
    const filePath = path.join(PATHS.assets, id, "records", "market_cap.csv");
    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await unlink(filePath).catch(() => {});

        const marketCapEntries = matchSupplyAndPrice(id);
        await writeToCsv(filePath, marketCapEntries, "timestamp");

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.assets}/${id}`, error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
