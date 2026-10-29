import { existsSync } from "node:fs";
import _ from "lodash";
import { readCSV } from "../../utils/csv";

/** A daily series of `[date (YYYY-MM-DD), value]` pairs, using the last value of each UTC day. */
export type DailySeries = [string, number][];

/**
 * Reduces a CSV of timestamped records to the last value per UTC day.
 * Returns an empty series if the file does not exist or has no numeric values.
 */
export async function dailySeries(csvPath: string, valuePath: string): Promise<DailySeries> {
    if (!existsSync(csvPath)) return [];

    const series: DailySeries = [];
    for await (const record of readCSV<primitive.Timestamped>(csvPath)) {
        const value: unknown = _.get(record, valuePath);
        if (typeof value !== "number" || !Number.isFinite(value)) continue;

        const date = record.timestamp.slice(0, 10);
        if (series.at(-1)?.[0] === date) {
            series[series.length - 1] = [date, value];
        } else {
            series.push([date, value]);
        }
    }
    return series;
}

/** Latest value and the relative change over the given number of days, if the data reaches back that far. */
export function latestWithChange(series: DailySeries, days: number[] = [1, 7, 30]) {
    const latest = series.at(-1);
    if (!latest) return null;

    const [date, value] = latest;
    const latestTime = Date.parse(date);
    const change: Record<string, number | null> = {};
    for (const d of days) {
        const target = latestTime - d * 24 * 60 * 60 * 1000;
        // Last entry at or before the target date
        const past = _.findLast(series, ([pastDate]) => Date.parse(pastDate) <= target);
        change[`${d}d`] = past && past[1] !== 0 ? value / past[1] - 1 : null;
    }
    return { date, value, change };
}

/**
 * Daily series of the USD value per underlying asset, from an underlying_assets.csv. Uses the last
 * record of each UTC day. Days without a record for an underlying asset are left out of its series.
 */
export async function dailyComposition(csvPath: string): Promise<Record<string, DailySeries>> {
    if (!existsSync(csvPath)) return {};

    const composition: Record<string, DailySeries> = {};
    for await (const record of readCSV<
        primitive.Timestamped & { breakdown?: Record<string, { usd?: unknown }> }
    >(csvPath)) {
        const date = record.timestamp.slice(0, 10);
        for (const [id, part] of Object.entries(record.breakdown ?? {})) {
            const value = part.usd;
            if (typeof value !== "number" || !Number.isFinite(value)) continue;
            const series = (composition[id] ??= []);
            if (series.at(-1)?.[0] === date) series[series.length - 1] = [date, value];
            else series.push([date, value]);
        }
    }
    return composition;
}
