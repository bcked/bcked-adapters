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
const priceLookup_1 = require("../utils/priceLookup");
const ASSETS_PATH = "assets";
async function* matchSupplyAndPrice(id, window = (0, date_fns_1.hoursToMilliseconds)(12)) {
    const supplyCsv = path_1.default.join(ASSETS_PATH, id, "records", "supply_amount.csv");
    if (!(0, fs_1.existsSync)(supplyCsv))
        return;
    const supplyEntries = (0, csv_1.readCSV)(supplyCsv);
    let priceLookup = new priceLookup_1.ConsecutivePriceLookup(id);
    for await (const supplyEntry of supplyEntries) {
        // Get closest prices to the current entry for all underlying assets
        const price = await priceLookup.getClosest(supplyEntry.timestamp, window);
        if (!price)
            continue;
        yield {
            timestamp: supplyEntry.timestamp,
            price: price,
            supply: supplyEntry,
            usd: price.usd * supplyEntry.amount,
        };
    }
}
worker_threads_1.parentPort?.on("message", async (id) => {
    console.log(`Precompiling market cap for asset ${id}`);
    const filePath = path_1.default.join(paths_1.PATHS.assets, id, "records", "market_cap.csv");
    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await (0, promises_1.unlink)(filePath).catch(() => { });
        const marketCapEntries = matchSupplyAndPrice(id);
        await (0, csv_1.writeToCsv)(filePath, marketCapEntries, "timestamp");
        worker_threads_1.parentPort?.postMessage(null);
    }
    catch (error) {
        console.error(`/${paths_1.PATHS.assets}/${id}`, error);
        await (0, bot_1.sendErrorReport)(`/${paths_1.PATHS.assets}/${id}`, error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=precompile_market_cap.js.map