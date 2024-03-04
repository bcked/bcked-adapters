"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const constants_1 = require("../../constants");
const bot_1 = require("../../watcher/bot");
const date_fns_1 = require("date-fns");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const csv_1 = require("../../utils/csv");
const files_1 = require("../../utils/files");
const math_1 = require("../../utils/math");
async function* match(id, window = (0, date_fns_1.hoursToMilliseconds)(12) // TODO this might be to small for some assets? Maybe this could be configured per asset?
) {
    const underlyingAssetsCsv = path_1.default.join(constants_1.PATHS.assets, id, constants_1.PATHS.records, constants_1.FILES.csv.underlyingAssets);
    const marketCapCsv = path_1.default.join(constants_1.PATHS.assets, id, constants_1.PATHS.records, constants_1.FILES.csv.marketCap);
    if (!(0, fs_1.existsSync)(underlyingAssetsCsv) || !(0, fs_1.existsSync)(marketCapCsv))
        return;
    const underlyingAssets = (0, csv_1.readCSV)(underlyingAssetsCsv);
    const marketCapLookup = new csv_1.ConsecutiveLookup(marketCapCsv);
    for await (const underlyingEntry of underlyingAssets) {
        // Get closest prices to the current entry for all underlying assets
        const market_cap = await marketCapLookup.getClosest(underlyingEntry.timestamp, window);
        if (!market_cap)
            continue;
        yield {
            timestamp: underlyingEntry.timestamp,
            market_cap: market_cap,
            collateral: underlyingEntry,
            ratio: (0, math_1.round)(underlyingEntry.usd / market_cap.usd, 4),
        };
    }
}
worker_threads_1.parentPort?.on("message", async (id) => {
    console.log(`Precompiling market cap for asset ${id}`);
    const filePath = path_1.default.join(constants_1.PATHS.assets, id, constants_1.PATHS.records, constants_1.FILES.csv.collateralizationRatio);
    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await (0, files_1.remove)(filePath);
        const entries = match(id);
        await (0, csv_1.writeToCsv)(filePath, entries, "timestamp");
        worker_threads_1.parentPort?.postMessage(null);
    }
    catch (error) {
        console.error(`/${constants_1.PATHS.assets}/${id}`, error);
        await (0, bot_1.sendErrorReport)(`/${constants_1.PATHS.assets}/${id}`, error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=precompile_collateralization_ratio.js.map