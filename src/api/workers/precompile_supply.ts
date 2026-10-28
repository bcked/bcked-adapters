import { parentPort } from "worker_threads";
import { FILES, PATHS } from "../../constants";
import { sendErrorReport } from "../../watcher/bot";

import { existsSync } from "fs";
import path from "path";
import { readCSV, writeToCsv } from "../../utils/csv";
import { remove } from "../../utils/files";

async function* computeSupplyFallback(
    id: bcked.asset.Id
): AsyncIterableIterator<bcked.asset.SupplyAmount> {
    const supplyCsv = path.join(PATHS.assets, id, PATHS.records, FILES.csv.supply);

    if (!existsSync(supplyCsv)) return;

    const supplyEntries = readCSV<bcked.asset.Supply>(supplyCsv);

    for await (const supplyEntry of supplyEntries) {
        // Get closest prices to the current entry for all underlying assets

        // Define fallback for supply data.
        // Circulating supply comes first, because the total can include unbacked tokens, e.g. tokens
        // held in the issuer's treasury.
        // Empty CSV cells are read as empty strings, so take the first actual number.
        const amount = [
            supplyEntry.circulating,
            supplyEntry.total,
            supplyEntry.issued,
            supplyEntry.max,
        ].find((value): value is number => typeof value === "number" && value > 0);

        if (!amount) continue;

        yield {
            ...supplyEntry,
            amount,
        };
    }
}

parentPort?.on("message", async (id: bcked.asset.Id) => {
    console.log(`Precompiling supply amount for asset ${id}`);
    const filePath = path.join(PATHS.assets, id, PATHS.records, FILES.csv.supplyAmount);
    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await remove(filePath);

        const entries = computeSupplyFallback(id);
        await writeToCsv(filePath, entries, "timestamp");

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.assets}/${id}`, error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
