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
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const csv_1 = require("../../utils/csv");
const files_1 = require("../../utils/files");
const math_1 = require("../../utils/math");
async function lookupUnderlyingPrice(timestamp, amount, lookup, window = (0, date_fns_1.hoursToMilliseconds)(12)) {
    const price = await lookup.getClosest(timestamp, window);
    if (!price)
        return { amount };
    return {
        amount,
        price: price,
        usd: (0, math_1.round)(price.usd * amount, 2),
    };
}
async function* match(id, window = (0, date_fns_1.hoursToMilliseconds)(12)) {
    const backingCsv = path_1.default.join(paths_1.PATHS.assets, id, "records", "backing.csv");
    if (!(0, fs_1.existsSync)(backingCsv))
        return;
    const backingEntries = (0, csv_1.readCSV)(backingCsv);
    let priceLookup = undefined;
    for await (const backingEntry of backingEntries) {
        // Initialize price lookup if not yet done
        if (priceLookup === undefined) {
            priceLookup = [];
            for (const underlyingAssetId of Object.keys(backingEntry.underlying)) {
                const priceCsv = path_1.default.join(paths_1.PATHS.assets, underlyingAssetId, "records", "price.csv");
                if (!(0, fs_1.existsSync)(priceCsv))
                    continue;
                priceLookup.push({
                    assetId: underlyingAssetId,
                    lookup: new csv_1.ConsecutiveLookup(priceCsv),
                });
            }
        }
        // Get closest prices to the current entry for all underlying assets
        const underlying = Object.fromEntries(await Promise.all(priceLookup.map(async ({ assetId, lookup }) => [
            assetId,
            await lookupUnderlyingPrice(backingEntry.timestamp, backingEntry.underlying[assetId], lookup, window),
        ])));
        yield {
            timestamp: backingEntry.timestamp,
            breakdown: underlying,
            usd: (0, math_1.round)(lodash_1.default.sumBy(Object.values(underlying), "usd"), 2),
        };
    }
}
worker_threads_1.parentPort?.on("message", async (id) => {
    console.log(`Precompiling prices of underlying assets for asset ${id}`);
    const filePath = path_1.default.join(paths_1.PATHS.assets, id, "records", "underlying_assets.csv");
    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await (0, files_1.remove)(filePath);
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
//# sourceMappingURL=precompile_underlying_assets.js.map