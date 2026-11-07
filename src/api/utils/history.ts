import { existsSync } from "fs";
import type { PropertyPath } from "lodash";
import path from "path";
import { FILES, PATHS } from "../../constants";
import { readCSV } from "../../utils/csv";
import { readJson, writeJson } from "../../utils/files";
import { StreamStats, type Stats } from "../../utils/stream";
import { getDateParts } from "../../utils/time";
import { isConsolidated, monthOf } from "./consolidate";

/**
 * Compiles the history resources of one records CSV: the history, and a resource per year, month,
 * day and hour. Days and hours of consolidated months are not written (see consolidate.ts); their
 * hour resources go into the month resource's `data` instead.
 */
export async function compileHistory<
    Id extends string,
    TObject extends primitive.Timestamped,
    TKey extends keyof TObject,
>(
    csvPath: string,
    id: Id,
    key: TKey | PropertyPath,
    createHistoryResource: (
        id: Id,
        latestTimestamp: primitive.ISODateTimeString | undefined,
        stats: Stats<TObject> | undefined,
        years: string[]
    ) => Promise<any>,
    createYearResource: (
        id: Id,
        stats: Stats<TObject> | undefined,
        year: string | undefined,
        months: string[]
    ) => Promise<any>,
    createMonthResource: (
        id: Id,
        stats: Stats<TObject> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) => Promise<any>,
    createDayResource: (
        id: Id,
        stats: Stats<TObject> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) => Promise<any>,
    createHourResource: (id: Id, stats: Stats<TObject> | undefined) => Promise<any>
) {
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
    // Hour resources of consolidated months, by month resource.
    const consolidated = new Map<string, { $id: string }[]>();
    let lastHour: { $id: string } | undefined;

    async function addHourToDay(hour: string) {
        const resource = await createHourResource(id, hoursStats?.get());
        if (resource?.$id) {
            lastHour = resource;
            if (isConsolidated(resource.$id)) {
                const month = monthOf(resource.$id)!;
                if (!consolidated.has(month)) consolidated.set(month, []);
                consolidated.get(month)!.push(resource);
            }
        }
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

    // A consolidated month lists its points inline instead of links to its days.
    for (const [month, points] of consolidated) {
        const file = path.join(PATHS.api, month, FILES.json.index);
        const resource = await readJson<Record<string, unknown>>(file);
        if (!resource) continue;
        resource["data"] = points.map(({ $id: _, ...point }) => point);
        await writeJson(file, resource);
    }
    // The latest point keeps its own file, so the history's `latest` link always resolves.
    if (lastHour && isConsolidated(lastHour.$id)) {
        await writeJson(path.join(PATHS.api, lastHour.$id, FILES.json.index), lastHour);
    }
}
