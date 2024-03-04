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
async function* match(id, window = (0, date_fns_1.hoursToMilliseconds)(12)) {
    const supplyCsv = path_1.default.join(constants_1.PATHS.assets, id, constants_1.PATHS.records, constants_1.FILES.csv.supplyAmount);
    const priceCsv = path_1.default.join(constants_1.PATHS.assets, id, constants_1.PATHS.records, constants_1.FILES.csv.price);
    if (!(0, fs_1.existsSync)(supplyCsv) || !(0, fs_1.existsSync)(priceCsv))
        return;
    const supplyEntries = (0, csv_1.readCSV)(supplyCsv);
    const priceLookup = new csv_1.ConsecutiveLookup(priceCsv);
    for await (const supplyEntry of supplyEntries) {
        // Get closest prices to the current entry for all underlying assets
        const price = await priceLookup.getClosest(supplyEntry.timestamp, window);
        if (!price)
            continue;
        yield {
            timestamp: supplyEntry.timestamp,
            price: price,
            supply: supplyEntry,
            usd: (0, math_1.round)(price.usd * supplyEntry.amount, 2),
        };
    }
}
worker_threads_1.parentPort?.on("message", async (id) => {
    console.log(`Precompiling market cap for asset ${id}`);
    const filePath = path_1.default.join(constants_1.PATHS.assets, id, constants_1.PATHS.records, constants_1.FILES.csv.marketCap);
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
//# sourceMappingURL=precompile_market_cap.js.map