"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const fs_1 = require("fs");
const lodash_1 = require("lodash");
const path_1 = __importDefault(require("path"));
const worker_threads_1 = require("worker_threads");
const constants_1 = require("../../constants");
const csv_1 = require("../../utils/csv");
const files_1 = require("../../utils/files");
const string_formatting_1 = require("../../utils/string_formatting");
const time_1 = require("../../utils/time");
const bot_1 = require("../../watcher/bot");
function initializeMarketCapLookups(assetIds) {
    const marketCapLookups = [];
    for (const assetId of assetIds) {
        const csvPath = path_1.default.join(constants_1.PATHS.assets, assetId, constants_1.PATHS.records, constants_1.FILES.csv.marketCap);
        if (!(0, fs_1.existsSync)(csvPath)) {
            continue;
        }
        marketCapLookups.push({
            assetId,
            lookup: new csv_1.ConsecutiveLookup(csvPath),
        });
    }
    return marketCapLookups;
}
async function getMarketCapForTimestamp(timestamp, marketCapLookups, window = (0, date_fns_1.hoursToMilliseconds)(12)) {
    // Get closest prices to the current entry for all underlying assets
    return Promise.all(marketCapLookups.map(async ({ assetId, lookup }) => ({
        assetId,
        marketCap: await lookup.getClosest(timestamp, window),
    })));
}
async function* computeTotalValueLocked(id, window = (0, date_fns_1.hoursToMilliseconds)(1)) {
    const assetsJson = path_1.default.join(constants_1.PATHS.entities, id, constants_1.PATHS.records, constants_1.FILES.json.assets);
    const assets = await (0, files_1.readJson)(assetsJson);
    if (!assets) {
        console.error("Assets not found");
        return;
    }
    const marketCapLookups = initializeMarketCapLookups(assets.ids);
    if (!marketCapLookups.length) {
        console.error("No market cap lookups found");
        return;
    }
    // TODO get latest entry from total value locked and continue from that time
    // const lastEntry = await getLatest<bcked.asset.Backing>(csvPath);
    // // Check if the latest records are of the same day. If yes, don't fetch, as there can be no newer data.
    // if (lastEntry !== null && isClose(lastEntry.timestamp, Date.now(), hoursInMs(23.99))) return;
    // const startOfRecordings = new Date("2022-11-02");
    // const startDate = new Date(lastEntry?.timestamp ?? startOfRecordings);
    const startDate = new Date("2022-11-02");
    // Loop through the dates using timestamps and create Date objects
    for (const timestamp of (0, time_1.getDatesBetween)(startDate, Date.now(), window)) {
        const marketCaps = await getMarketCapForTimestamp(timestamp, marketCapLookups, window);
        if (!marketCaps.length) {
            continue;
        }
        const totalValueLocked = (0, lodash_1.sumBy)(marketCaps, "marketCap.usd");
        if (!totalValueLocked) {
            continue;
        }
        yield {
            timestamp: (0, string_formatting_1.toISOString)(timestamp),
            // assets: marketCaps.map((marketCap) => ({
            //     id: marketCap.assetId,
            //     timestamp: marketCap.marketCap?.timestamp,
            //     usd: marketCap.marketCap?.usd,
            // })),
            totalValueLocked,
        };
    }
}
worker_threads_1.parentPort?.on("message", async (id) => {
    const step = `Precompile entity ${id} total value locked`;
    console.log(step);
    const filePath = path_1.default.join(constants_1.PATHS.entities, id, constants_1.PATHS.records, constants_1.FILES.csv.totalValueLocked);
    try {
        // Delete file if it already exists
        // TODO Later change this to start at the current date and only append changes
        await (0, files_1.remove)(filePath);
        const entries = computeTotalValueLocked(id);
        await (0, csv_1.writeToCsv)(filePath, entries, "timestamp");
        worker_threads_1.parentPort?.postMessage(null);
    }
    catch (error) {
        console.error(step, error);
        await (0, bot_1.sendErrorReport)(step, error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=precompile_entities_total_value_locked.js.map