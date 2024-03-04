import { existsSync } from "fs";
import { PropertyPath } from "lodash";
import path from "path";
import { parentPort } from "worker_threads";
import { FILES, PATHS } from "../../constants";
import { readCSV } from "../../utils/csv";
import { Stats, StreamStats } from "../../utils/stream";
import { getDateParts } from "../../utils/time";
import { sendErrorReport } from "../../watcher/bot";
import { SYSTEM_RESOURCES } from "../resources/systems";
import { compileAssets, compileDetails, compileIcons } from "../utils/compile";

async function compileHistory<TObject extends primitive.Timestamped, TKey extends keyof TObject>(
    csvName: string,
    id: bcked.system.Id,
    key: TKey | PropertyPath,
    createHistoryResource: (
        id: bcked.system.Id,
        latestTimestamp: primitive.ISODateTimeString | undefined,
        stats: Stats<TObject> | undefined,
        years: string[]
    ) => Promise<any>,
    createYearResource: (
        id: bcked.system.Id,
        stats: Stats<TObject> | undefined,
        year: string | undefined,
        months: string[]
    ) => Promise<any>,
    createMonthResource: (
        id: bcked.system.Id,
        stats: Stats<TObject> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) => Promise<any>,
    createDayResource: (
        id: bcked.system.Id,
        stats: Stats<TObject> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) => Promise<any>,
    createHourResource: (id: bcked.system.Id, stats: Stats<TObject> | undefined) => Promise<any>
) {
    const csvPath = path.join(PATHS.entities, id, PATHS.records, csvName);

    if (!existsSync(csvPath)) return;

    const historyStats = new StreamStats<TObject, TKey>(key, 100);

    const yearsOfHistory: string[] = [];
    let yearsStats: StreamStats<TObject, TKey> | undefined;
    let monthsOfYear: string[] = [];
    let monthsStats: StreamStats<TObject, TKey> | undefined;
    let daysOfMonth: string[] = [];
    let daysStats: StreamStats<TObject, TKey> | undefined;
    let hoursOfDay: string[] = [];
    let hoursStats: StreamStats<TObject, TKey> | undefined;
    let historyObject: TObject | undefined;

    async function addHourToDay(hour: string) {
        await createHourResource(id, hoursStats?.get());
        hoursOfDay.push(hour);
        hoursStats = new StreamStats(key, 100);
    }

    async function addDayToMonth(day: string, hour: string) {
        await createDayResource(
            id,
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
            id,
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
        await createYearResource(id, yearsStats?.get(), yearsOfHistory.at(-1), monthsOfYear);
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

    await createHistoryResource(id, historyObject?.timestamp, historyStats.get(), yearsOfHistory);
    // Finalize by storing last year, month, day, hour
    await addYearToHistory("N/A", "N/A", "N/A", "N/A");
}

parentPort?.on("message", async (id: bcked.system.Id) => {
    console.log(`Compile system ${id}`);
    try {
        await Promise.all([
            SYSTEM_RESOURCES.system(id),
            compileDetails(SYSTEM_RESOURCES, PATHS.systems, id),
            compileIcons(SYSTEM_RESOURCES, PATHS.systems, id),
            compileAssets(SYSTEM_RESOURCES, PATHS.systems, id),
            compileHistory<bcked.system.TotalValueLocked, "totalValueLocked">(
                FILES.csv.totalValueLocked,
                id,
                "totalValueLocked",
                SYSTEM_RESOURCES.totalValueLockedHistory,
                SYSTEM_RESOURCES.totalValueLockedYear,
                SYSTEM_RESOURCES.totalValueLockedMonth,
                SYSTEM_RESOURCES.totalValueLockedDay,
                SYSTEM_RESOURCES.totalValueLockedHour
            ),
        ]);

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.systems}/${id}`, error);
        await sendErrorReport(`/${PATHS.systems}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
