"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const paths_1 = require("../../paths");
const bot_1 = require("../../watcher/bot");
const date_fns_1 = require("date-fns");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const csv_1 = require("../../utils/csv");
async function* match(id, window = (0, date_fns_1.hoursToMilliseconds)(12) // TODO this might be to small for some assets? Maybe this could be configured per asset?
) {
    const underlyingAssetsCsv = path_1.default.join(paths_1.PATHS.assets, id, "records", "underlying_assets.csv");
    const marketCapCsv = path_1.default.join(paths_1.PATHS.assets, id, "records", "market_cap.csv");
    if (!(0, fs_1.existsSync)(underlyingAssetsCsv) || !(0, fs_1.existsSync)(marketCapCsv))
        return;
    const underlyingAssets = (0, csv_1.readCSV)(underlyingAssetsCsv);
    let marketCapLookup = new csv_1.ConsecutiveLookup(marketCapCsv);
    for await (const underlyingEntry of underlyingAssets) {
        // Get closest prices to the current entry for all underlying assets
        const market_cap = await marketCapLookup.getClosest(underlyingEntry.timestamp, window);
        if (!market_cap)
            continue;
        yield {
            timestamp: underlyingEntry.timestamp,
            market_cap: market_cap,
            collateral: underlyingEntry,
            ratio: underlyingEntry.usd / market_cap.usd,
        };
    }
}
worker_threads_1.parentPort?.on("message", async (id) => {
    console.log(`Precompiling market cap for asset ${id}`);
    const filePath = path_1.default.join(paths_1.PATHS.assets, id, "records", "collateralization_ratio.csv");
    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await (0, promises_1.unlink)(filePath).catch(() => { });
        const entries = match(id);
        await (0, csv_1.writeToCsv)(filePath, entries, "timestamp");
        worker_threads_1.parentPort?.postMessage(null);
    }
    catch (error) {
        console.error(`/${paths_1.PATHS.assets}/${id}`, error);
        await (0, bot_1.sendErrorReport)(`/${paths_1.PATHS.assets}/${id}`, error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=precompile_collateralization_ratio.js.map