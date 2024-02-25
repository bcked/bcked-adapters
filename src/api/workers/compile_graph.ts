import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";

import { existsSync } from "fs";
import { PropertyPath } from "lodash";
import path from "path";
import { readCSV } from "../../utils/csv";
import { Stats, StreamStats } from "../../utils/stream";
import { getDateParts } from "../../utils/time";
import { ASSET_RESOURCES } from "../resources/assets";

async function compileHistory<
    TObject extends primitive.Timestamped,
    TKey extends keyof TObject | PropertyPath
>(
    csvName: string,
    key: TKey,
    createHistoryResource: (
        latestTimestamp: primitive.ISODateTimeString | undefined,
        stats: Stats<TObject> | undefined,
        years: string[]
    ) => Promise<any>,
    createYearResource: (
        stats: Stats<TObject> | undefined,
        year: string | undefined,
        months: string[]
    ) => Promise<any>,
    createMonthResource: (
        stats: Stats<TObject> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) => Promise<any>,
    createDayResource: (
        stats: Stats<TObject> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) => Promise<any>,
    createHourResource: (stats: Stats<TObject> | undefined) => Promise<any>
) {
    const csvPath = path.join(PATHS.graph, PATHS.records, csvName);

    if (!existsSync(csvPath)) return;

    const historyStats: StreamStats<TObject, TKey> = new StreamStats(key, 100);

    let yearsOfHistory: string[] = [];
    let yearsStats: StreamStats<TObject, TKey> | undefined;
    let monthsOfYear: string[] = [];
    let monthsStats: StreamStats<TObject, TKey> | undefined;
    let daysOfMonth: string[] = [];
    let daysStats: StreamStats<TObject, TKey> | undefined;
    let hoursOfDay: string[] = [];
    let hoursStats: StreamStats<TObject, TKey> | undefined;
    let historyObject: TObject | undefined;

    async function addHourToDay(hour: string) {
        await createHourResource(hoursStats?.get());
        hoursOfDay.push(hour);
        hoursStats = new StreamStats(key, 100);
    }

    async function addDayToMonth(day: string, hour: string) {
        await createDayResource(
            daysStats?.get(),
            yearsOfHistory.at(-1),
            monthsOfYear.at(-1),
            daysOfMonth.at(-1),
            hoursOfDay
        );
        await addHourToDay(hour);
        hoursOfDay = [hour];
        daysOfMonth.push(day);
        daysStats = new StreamStats(key, 100);
    }

    async function addMonthToYear(month: string, day: string, hour: string) {
        await createMonthResource(
            monthsStats?.get(),
            yearsOfHistory.at(-1),
            monthsOfYear.at(-1),
            daysOfMonth
        );
        await addDayToMonth(day, hour);
        daysOfMonth = [day];
        monthsOfYear.push(month);
        monthsStats = new StreamStats(key, 100);
    }

    async function addYearToHistory(year: string, month: string, day: string, hour: string) {
        await createYearResource(yearsStats?.get(), yearsOfHistory.at(-1), monthsOfYear);
        await addMonthToYear(month, day, hour);
        monthsOfYear = [month];
        yearsOfHistory.push(year);
        yearsStats = new StreamStats(key, 100);
    }

    for await (historyObject of readCSV<TObject>(csvPath)) {
        const { year, month, day, hour } = getDateParts(historyObject.timestamp);

        if (yearsOfHistory.at(-1) !== year) {
            await addYearToHistory(year!, month!, day!, hour!);
        }

        if (monthsOfYear.at(-1) !== month) {
            await addMonthToYear(month!, day!, hour!);
        }

        if (daysOfMonth.at(-1) !== day) {
            await addDayToMonth(day!, hour!);
        }

        if (hoursOfDay.at(-1) !== hour) {
            await addHourToDay(hour!);
        }

        historyStats.add(historyObject);
        yearsStats!.add(historyObject);
        monthsStats!.add(historyObject);
        daysStats!.add(historyObject);
        hoursStats!.add(historyObject);
    }

    if (!yearsOfHistory.length) return;

    await createHistoryResource(historyObject?.timestamp, historyStats.get(), yearsOfHistory);
    // Finalize by storing last year, month, day, hour
    await addYearToHistory("N/A", "N/A", "N/A", "N/A");
}

parentPort?.on("message", async () => {
    console.log(`Compile Global Graph`);

    try {
        await Promise.all([
            compileHistory<bcked.asset.Graph, "stats.leaveCollateralization">(
                "collateralization_graph.csv",
                "stats.leaveCollateralization",
                ASSET_RESOURCES.collateralizationGraphHistory,
                ASSET_RESOURCES.collateralizationGraphYear,
                ASSET_RESOURCES.collateralizationGraphMonth,
                ASSET_RESOURCES.collateralizationGraphDay,
                ASSET_RESOURCES.collateralizationGraphHour
            ),
        ]);

        parentPort?.postMessage(null);
    } catch (error) {
        const step = `/${PATHS.assets}/collateralization-graph`;
        console.error(step, error);
        await sendErrorReport(step, error);
        parentPort?.postMessage(null);
    }
});
