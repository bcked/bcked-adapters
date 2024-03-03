import { parentPort } from "worker_threads";
import { PATHS } from "../../constants";
import { sendErrorReport } from "../../watcher/bot";

import { hoursToMilliseconds } from "date-fns";
import { existsSync } from "fs";
import path from "path";
import { ConsecutiveLookup, readCSV, writeToCsv } from "../../utils/csv";
import { remove } from "../../utils/files";
import { round } from "../../utils/math";

async function* match(
    id: bcked.asset.Id,
    window: number = hoursToMilliseconds(12) // TODO this might be to small for some assets? Maybe this could be configured per asset?
): AsyncIterableIterator<bcked.asset.Collateralization> {
    const underlyingAssetsCsv = path.join(PATHS.assets, id, "records", "underlying_assets.csv");
    const marketCapCsv = path.join(PATHS.assets, id, "records", "market_cap.csv");

    if (!existsSync(underlyingAssetsCsv) || !existsSync(marketCapCsv)) return;

    const underlyingAssets = readCSV<bcked.asset.Relationships>(underlyingAssetsCsv);

    const marketCapLookup = new ConsecutiveLookup<bcked.asset.MarketCap>(marketCapCsv);

    for await (const underlyingEntry of underlyingAssets) {
        // Get closest prices to the current entry for all underlying assets

        const market_cap = await marketCapLookup.getClosest(underlyingEntry.timestamp, window);

        if (!market_cap) continue;

        yield {
            timestamp: underlyingEntry.timestamp,
            market_cap: market_cap,
            collateral: underlyingEntry,
            ratio: round(underlyingEntry.usd / market_cap.usd, 4),
        };
    }
}

parentPort?.on("message", async (id: bcked.asset.Id) => {
    console.log(`Precompiling market cap for asset ${id}`);
    const filePath = path.join(PATHS.assets, id, "records", "collateralization_ratio.csv");
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
