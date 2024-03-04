"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const constants_1 = require("../../constants");
const bot_1 = require("../../watcher/bot");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const csv_1 = require("../../utils/csv");
const stream_1 = require("../../utils/stream");
const time_1 = require("../../utils/time");
const assets_1 = require("../resources/assets");
async function compileHistory(csvName, key, createHistoryResource, createYearResource, createMonthResource, createDayResource) {
    const csvPath = path_1.default.join(constants_1.PATHS.graph, constants_1.PATHS.records, csvName);
    if (!(0, fs_1.existsSync)(csvPath))
        return;
    const historyStats = new stream_1.StreamStats(key, 100);
    const yearsOfHistory = [];
    let yearsStats;
    let monthsOfYear = [];
    let monthsStats;
    let daysOfMonth = [];
    let daysStats;
    let historyObject;
    async function addDayToMonth(day) {
        await createDayResource(daysStats?.get());
        daysOfMonth.push(day);
        daysStats = new stream_1.StreamStats(key, 100);
    }
    async function addMonthToYear(month, day) {
        await createMonthResource(monthsStats?.get(), yearsOfHistory.at(-1), monthsOfYear.at(-1), daysOfMonth);
        await addDayToMonth(day);
        daysOfMonth = [day];
        monthsOfYear.push(month);
        monthsStats = new stream_1.StreamStats(key, 100);
    }
    async function addYearToHistory(year, month, day) {
        await createYearResource(yearsStats?.get(), yearsOfHistory.at(-1), monthsOfYear);
        await addMonthToYear(month, day);
        monthsOfYear = [month];
        yearsOfHistory.push(year);
        yearsStats = new stream_1.StreamStats(key, 100);
    }
    for await (historyObject of (0, csv_1.readCSV)(csvPath)) {
        const { year, month, day } = (0, time_1.getDateParts)(historyObject.timestamp);
        if (yearsOfHistory.at(-1) !== year) {
            await addYearToHistory(year, month, day);
        }
        if (monthsOfYear.at(-1) !== month) {
            await addMonthToYear(month, day);
        }
        if (daysOfMonth.at(-1) !== day) {
            await addDayToMonth(day);
        }
        historyStats.add(historyObject);
        yearsStats.add(historyObject);
        monthsStats.add(historyObject);
        daysStats.add(historyObject);
    }
    if (!yearsOfHistory.length)
        return;
    await createHistoryResource(historyObject?.timestamp, historyStats.get(), yearsOfHistory);
    // Finalize by storing last year, month, day, hour
    await addYearToHistory("N/A", "N/A", "N/A");
}
worker_threads_1.parentPort?.on("message", async () => {
    console.log(`Compile Global Graph`);
    try {
        await Promise.all([
            compileHistory(constants_1.FILES.csv.collateralizationGraph, "stats.leaveCollateralization", assets_1.ASSET_RESOURCES.collateralizationGraphHistory, assets_1.ASSET_RESOURCES.collateralizationGraphYear, assets_1.ASSET_RESOURCES.collateralizationGraphMonth, assets_1.ASSET_RESOURCES.collateralizationGraphDay),
        ]);
        worker_threads_1.parentPort?.postMessage(null);
    }
    catch (error) {
        const step = `/${constants_1.PATHS.assets}/collateralization-graph`;
        console.error(step, error);
        await (0, bot_1.sendErrorReport)(step, error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=compile_graph.js.map