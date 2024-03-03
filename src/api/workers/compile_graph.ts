import { parentPort } from "worker_threads";
import { FILES, PATHS } from "../../constants";
import { sendErrorReport } from "../../watcher/bot";

import { existsSync } from "fs";
import type { PropertyPath } from "lodash";
import path from "path";
import { readCSV } from "../../utils/csv";
import { StreamStats, type Stats } from "../../utils/stream";
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
    createDayResource: (stats: Stats<TObject> | undefined) => Promise<any>
) {
    const csvPath = path.join(PATHS.graph, PATHS.records, csvName);

    if (!existsSync(csvPath)) return;

    const historyStats = new StreamStats<TObject, TKey>(key, 100);

    const yearsOfHistory: string[] = [];
    let yearsStats: StreamStats<TObject, TKey> | undefined;
    let monthsOfYear: string[] = [];
    let monthsStats: StreamStats<TObject, TKey> | undefined;
    let daysOfMonth: string[] = [];
    let daysStats: StreamStats<TObject, TKey> | undefined;
    let historyObject: TObject | undefined;

    async function addDayToMonth(day: string) {
        await createDayResource(daysStats?.get());
        daysOfMonth.push(day);
        daysStats = new StreamStats(key, 100);
    }

    async function addMonthToYear(month: string, day: string) {
        await createMonthResource(
            monthsStats?.get(),
            yearsOfHistory.at(-1),
            monthsOfYear.at(-1),
            daysOfMonth
        );
        await addDayToMonth(day);
        daysOfMonth = [day];
        monthsOfYear.push(month);
        monthsStats = new StreamStats(key, 100);
    }

    async function addYearToHistory(year: string, month: string, day: string) {
        await createYearResource(yearsStats?.get(), yearsOfHistory.at(-1), monthsOfYear);
        await addMonthToYear(month, day);
        monthsOfYear = [month];
        yearsOfHistory.push(year);
        yearsStats = new StreamStats(key, 100);
    }

    for await (historyObject of readCSV<TObject>(csvPath)) {
        const { year, month, day } = getDateParts(historyObject.timestamp);

        if (yearsOfHistory.at(-1) !== year) {
            await addYearToHistory(year!, month!, day!);
        }

        if (monthsOfYear.at(-1) !== month) {
            await addMonthToYear(month!, day!);
        }

        if (daysOfMonth.at(-1) !== day) {
            await addDayToMonth(day!);
        }

        historyStats.add(historyObject);
        yearsStats!.add(historyObject);
        monthsStats!.add(historyObject);
        daysStats!.add(historyObject);
    }

    if (!yearsOfHistory.length) return;

    await createHistoryResource(historyObject?.timestamp, historyStats.get(), yearsOfHistory);
    // Finalize by storing last year, month, day, hour
    await addYearToHistory("N/A", "N/A", "N/A");
}

parentPort?.on("message", async () => {
    console.log(`Compile Global Graph`);

    try {
        await Promise.all([
            compileHistory<bcked.asset.Graph, "stats.leaveCollateralization">(
                FILES.csv.collateralizationGraph,
                "stats.leaveCollateralization",
                ASSET_RESOURCES.collateralizationGraphHistory,
                ASSET_RESOURCES.collateralizationGraphYear,
                ASSET_RESOURCES.collateralizationGraphMonth,
                ASSET_RESOURCES.collateralizationGraphDay
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
