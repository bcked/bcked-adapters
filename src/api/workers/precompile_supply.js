"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const paths_1 = require("../../paths");
const bot_1 = require("../../watcher/bot");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const csv_1 = require("../../utils/csv");
const files_1 = require("../../utils/files");
const ASSETS_PATH = "assets";
async function* computeSupplyFallback(id) {
    const supplyCsv = path_1.default.join(ASSETS_PATH, id, "records", "supply.csv");
    if (!(0, fs_1.existsSync)(supplyCsv))
        return;
    const supplyEntries = (0, csv_1.readCSV)(supplyCsv);
    for await (const supplyEntry of supplyEntries) {
        // Get closest prices to the current entry for all underlying assets
        // Define fallback for supply data
        const amount = supplyEntry.total ?? supplyEntry.circulating ?? supplyEntry.issued ?? supplyEntry.max;
        if (!amount)
            continue;
        yield {
            ...supplyEntry,
            amount,
        };
    }
}
worker_threads_1.parentPort?.on("message", async (id) => {
    console.log(`Precompiling supply amount for asset ${id}`);
    const filePath = path_1.default.join(paths_1.PATHS.assets, id, "records", "supply_amount.csv");
    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await (0, files_1.remove)(filePath);
        const entries = computeSupplyFallback(id);
        await (0, csv_1.writeToCsv)(filePath, entries, "timestamp");
        worker_threads_1.parentPort?.postMessage(null);
    }
    catch (error) {
        console.error(`/${paths_1.PATHS.assets}/${id}`, error);
        await (0, bot_1.sendErrorReport)(`/${paths_1.PATHS.assets}/${id}`, error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=precompile_supply.js.map