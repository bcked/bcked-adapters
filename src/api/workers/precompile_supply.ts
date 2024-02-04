import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";

import { existsSync } from "fs";
import { unlink } from "fs/promises";
import path from "path";
import { readCSV, writeToCsv } from "../../utils/csv";

const ASSETS_PATH = "assets";

async function* computeSupplyFallback(
    id: bcked.asset.Id
): AsyncIterableIterator<bcked.asset.SupplyAmount> {
    const supplyCsv = path.join(ASSETS_PATH, id, "records", "supply.csv");

    if (!existsSync(supplyCsv)) return;

    const supplyEntries = readCSV<bcked.asset.Supply>(supplyCsv);

    for await (const supplyEntry of supplyEntries) {
        // Get closest prices to the current entry for all underlying assets

        // Define fallback for supply data
        const amount =
            supplyEntry.total || supplyEntry.circulating || supplyEntry.issued || supplyEntry.max;

        if (!amount) continue;

        yield {
            ...supplyEntry,
            amount,
        };
    }
}

parentPort?.on("message", async (id: bcked.asset.Id) => {
    console.log(`Precompiling supply amount for asset ${id}`);
    const filePath = path.join(PATHS.assets, id, "records", "supply_amount.csv");
    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await unlink(filePath).catch(() => {});

        const supply = computeSupplyFallback(id);
        await writeToCsv(filePath, supply, "timestamp");

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.assets}/${id}`, error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
