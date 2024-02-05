"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const worker_threads_1 = require("worker_threads");
const paths_1 = require("../../paths");
const csv_1 = require("../../utils/csv");
const stream_1 = require("../../utils/stream");
const time_1 = require("../../utils/time");
const bot_1 = require("../../watcher/bot");
const assets_1 = require("../resources/assets");
const compile_1 = require("../utils/compile");
async function compileHistory(csvName, id, key, createHistoryResource, createYearResource, createMonthResource, createDayResource, createHourResource) {
    const csvPath = path_1.default.join(paths_1.PATHS.assets, id, "records", csvName);
    if (!(0, fs_1.existsSync)(csvPath))
        return;
    const historyStats = new stream_1.StreamStats(key, 100);
    let yearsOfHistory = [];
    let yearsStats;
    let monthsOfYear = [];
    let monthsStats;
    let daysOfMonth = [];
    let daysStats;
    let hoursOfDay = [];
    let hoursStats;
    let historyObject;
    async function addHourToDay(hour) {
        await createHourResource(id, hoursStats?.get());
        hoursOfDay.push(hour);
        hoursStats = new stream_1.StreamStats(key, 100);
    }
    async function addDayToMonth(day, hour) {
        await createDayResource(id, daysStats?.get(), yearsOfHistory.at(-1), monthsOfYear.at(-1), daysOfMonth.at(-1), hoursOfDay);
        await addHourToDay(hour);
        hoursOfDay = [hour];
        daysOfMonth.push(day);
        daysStats = new stream_1.StreamStats(key, 100);
    }
    async function addMonthToYear(month, day, hour) {
        await createMonthResource(id, monthsStats?.get(), yearsOfHistory.at(-1), monthsOfYear.at(-1), daysOfMonth);
        await addDayToMonth(day, hour);
        daysOfMonth = [day];
        monthsOfYear.push(month);
        monthsStats = new stream_1.StreamStats(key, 100);
    }
    async function addYearToHistory(year, month, day, hour) {
        await createYearResource(id, yearsStats?.get(), yearsOfHistory.at(-1), monthsOfYear);
        await addMonthToYear(month, day, hour);
        monthsOfYear = [month];
        yearsOfHistory.push(year);
        yearsStats = new stream_1.StreamStats(key, 100);
    }
    for await (historyObject of (0, csv_1.readCSV)(csvPath)) {
        const { year, month, day, hour } = (0, time_1.getDateParts)(historyObject.timestamp);
        if (yearsOfHistory.at(-1) !== year) {
            await addYearToHistory(year, month, day, hour);
        }
        if (monthsOfYear.at(-1) !== month) {
            await addMonthToYear(month, day, hour);
        }
        if (daysOfMonth.at(-1) !== day) {
            await addDayToMonth(day, hour);
        }
        if (hoursOfDay.at(-1) !== hour) {
            await addHourToDay(hour);
        }
        historyStats.add(historyObject);
        yearsStats.add(historyObject);
        monthsStats.add(historyObject);
        daysStats.add(historyObject);
        hoursStats.add(historyObject);
    }
    if (!yearsOfHistory.length)
        return;
    await createHistoryResource(id, historyObject?.timestamp, historyStats.get(), yearsOfHistory);
    // Finalize by storing last year, month, day, hour
    await addYearToHistory("N/A", "N/A", "N/A", "N/A");
}
worker_threads_1.parentPort?.on("message", async (id) => {
    console.log(`Compile asset ${id}`);
    try {
        await Promise.all([
            assets_1.ASSET_RESOURCES.asset(id),
            (0, compile_1.compileDetails)(assets_1.ASSET_RESOURCES, paths_1.PATHS.assets, id),
            (0, compile_1.compileIcons)(assets_1.ASSET_RESOURCES, paths_1.PATHS.assets, id),
            compileHistory("price.csv", id, "usd", assets_1.ASSET_RESOURCES.priceHistory, assets_1.ASSET_RESOURCES.priceYear, assets_1.ASSET_RESOURCES.priceMonth, assets_1.ASSET_RESOURCES.priceDay, assets_1.ASSET_RESOURCES.priceHour),
            compileHistory("supply_amount.csv", id, "amount", assets_1.ASSET_RESOURCES.supplyHistory, assets_1.ASSET_RESOURCES.supplyYear, assets_1.ASSET_RESOURCES.supplyMonth, assets_1.ASSET_RESOURCES.supplyDay, assets_1.ASSET_RESOURCES.supplyHour),
            compileHistory("market_cap.csv", id, "usd", assets_1.ASSET_RESOURCES.marketCapHistory, assets_1.ASSET_RESOURCES.marketCapYear, assets_1.ASSET_RESOURCES.marketCapMonth, assets_1.ASSET_RESOURCES.marketCapDay, assets_1.ASSET_RESOURCES.marketCapHour),
            compileHistory("underlying_assets.csv.csv", id, "usd", assets_1.ASSET_RESOURCES.underlyingAssetsHistory, assets_1.ASSET_RESOURCES.underlyingAssetsYear, assets_1.ASSET_RESOURCES.underlyingAssetsMonth, assets_1.ASSET_RESOURCES.underlyingAssetsDay, assets_1.ASSET_RESOURCES.underlyingAssetsHour),
        ]);
        worker_threads_1.parentPort?.postMessage(null);
    }
    catch (error) {
        console.error(`/${paths_1.PATHS.assets}/${id}`, error);
        await (0, bot_1.sendErrorReport)(`/${paths_1.PATHS.assets}/${id}`, error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=compile_asset.js.map