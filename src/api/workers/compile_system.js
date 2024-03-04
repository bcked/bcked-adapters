"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const worker_threads_1 = require("worker_threads");
const constants_1 = require("../../constants");
const csv_1 = require("../../utils/csv");
const stream_1 = require("../../utils/stream");
const time_1 = require("../../utils/time");
const bot_1 = require("../../watcher/bot");
const systems_1 = require("../resources/systems");
const compile_1 = require("../utils/compile");
async function compileHistory(csvName, id, key, createHistoryResource, createYearResource, createMonthResource, createDayResource, createHourResource) {
    const csvPath = path_1.default.join(constants_1.PATHS.entities, id, constants_1.PATHS.records, csvName);
    if (!(0, fs_1.existsSync)(csvPath))
        return;
    const historyStats = new stream_1.StreamStats(key, 100);
    const yearsOfHistory = [];
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
    console.log(`Compile system ${id}`);
    try {
        await Promise.all([
            systems_1.SYSTEM_RESOURCES.system(id),
            (0, compile_1.compileDetails)(systems_1.SYSTEM_RESOURCES, constants_1.PATHS.systems, id),
            (0, compile_1.compileIcons)(systems_1.SYSTEM_RESOURCES, constants_1.PATHS.systems, id),
            (0, compile_1.compileAssets)(systems_1.SYSTEM_RESOURCES, constants_1.PATHS.systems, id),
            compileHistory(constants_1.FILES.csv.totalValueLocked, id, "totalValueLocked", systems_1.SYSTEM_RESOURCES.totalValueLockedHistory, systems_1.SYSTEM_RESOURCES.totalValueLockedYear, systems_1.SYSTEM_RESOURCES.totalValueLockedMonth, systems_1.SYSTEM_RESOURCES.totalValueLockedDay, systems_1.SYSTEM_RESOURCES.totalValueLockedHour),
        ]);
        worker_threads_1.parentPort?.postMessage(null);
    }
    catch (error) {
        console.error(`/${constants_1.PATHS.systems}/${id}`, error);
        await (0, bot_1.sendErrorReport)(`/${constants_1.PATHS.systems}/${id}`, error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=compile_system.js.map