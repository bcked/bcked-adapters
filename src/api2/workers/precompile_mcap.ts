import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";

import { hoursToMilliseconds } from "date-fns";
import { existsSync } from "fs";
import { unlink } from "fs/promises";
import path from "path";
import { readCSV, writeToCsv } from "../../utils/csv";
import { ConsecutivePriceLookup } from "../utils/priceLookup";
import { supplyAmount } from "../utils/supply";

const ASSETS_PATH = "assets";

async function* matchSupplyAndPrice(
    id: bcked.asset.Id,
    window: number = hoursToMilliseconds(12)
): AsyncIterableIterator<bcked.asset.Mcap> {
    const supplyCsv = path.join(ASSETS_PATH, id, "records", "supply.csv");

    if (!existsSync(supplyCsv)) return;

    const supplyEntries = readCSV<bcked.asset.Supply>(supplyCsv);

    let priceLookup = new ConsecutivePriceLookup(id);

    for await (const supplyEntry of supplyEntries) {
        // Get closest prices to the current entry for all underlying assets

        const amount = supplyAmount(supplyEntry);

        if (!amount) continue;

        const price = await priceLookup.getClosest(supplyEntry.timestamp, window);

        if (!price) continue;

        yield {
            timestamp: supplyEntry.timestamp,
            price: {
                usd: price.usd,
            },
            supply: { amount },
            value: {
                usd: price.usd * amount,
            },
        };
    }
}

parentPort?.on("message", async (id: bcked.asset.Id) => {
    try {
        console.log(`Precompiling backing prices for asset ${id}`);
        const filePath = path.join(PATHS.assets, id, "records", "mcap.csv");

        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await unlink(filePath).catch(() => {});

        const backingPrices = matchSupplyAndPrice(id);
        await writeToCsv(filePath, backingPrices, "timestamp");

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
