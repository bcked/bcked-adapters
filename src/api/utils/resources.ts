import { Stats } from "../../utils/stream";
import { setDateParts } from "../../utils/time";

/**
 * Converts the statistics object to a summary object.
 * @param path - The path to set in the summary object, this includes which parts of the date to include e.g. `${path}/{year}/{month}/{day}/{hour}`.
 * @param stats - The statistics object containing min, max, and median values.
 * @returns The summary object with low, median, and high values.
 * @throws Error if the stats object is missing min, max, or median values.
 */
export function statsToSummary<T extends primitive.Timestamped>(path: string, stats: Stats<T>) {
    if (!stats.min || !stats.max || !stats.median) {
        throw new Error("Stats missing. This should have been checked prior.");
    }

    return {
        low: {
            $ref: setDateParts(path, stats.min.timestamp),
        },
        median: {
            $ref: setDateParts(path, stats.median.timestamp),
        },
        high: {
            $ref: setDateParts(path, stats.max.timestamp),
        },
    };
}

export function historyResource<T extends primitive.Timestamped>(
    path: string,
    latestTimestamp: primitive.ISODateTimeString | undefined,
    stats: Stats<T> | undefined,
    years: string[],
    dateParts: string = "{year}/{month}/{day}/{hour}"
) {
    if (!latestTimestamp || !stats || !stats.min || !stats.max || !stats.median || !years.length)
        return;

    return {
        $id: path,
        latest: {
            $ref: setDateParts(`${path}/${dateParts}`, latestTimestamp),
        },
        history: {
            ...statsToSummary(`${path}/${dateParts}`, stats),
            data: years.map((year) => ({
                $ref: `${path}/${year}`,
            })),
        },
    };
}

export function yearResource<T extends primitive.Timestamped>(
    path: string,
    stats: Stats<T> | undefined,
    year: string | undefined,
    months: string[],
    dateParts: string = "{year}/{month}/{day}/{hour}"
) {
    if (!year || !months.length) return;

    if (!stats?.min || !stats.max || !stats.median) return;

    return {
        $id: `${path}/${year}`,
        ...statsToSummary(`${path}/${dateParts}`, stats),
        data: months.map((month) => ({
            $ref: `${path}/${year}/${month}`,
        })),
    };
}

export function monthResource<T extends primitive.Timestamped>(
    path: string,
    stats: Stats<T> | undefined,
    year: string | undefined,
    month: string | undefined,
    days: string[],
    dateParts: string = "{year}/{month}/{day}/{hour}"
) {
    if (!year || !month || !days.length) return;

    if (!stats?.min || !stats.max || !stats.median) return;

    return {
        $id: `${path}/${year}/${month}`,
        ...statsToSummary(`${path}/${dateParts}`, stats),
        data: days.map((day) => ({
            $ref: `${path}/${year}/${month}/${day}`,
        })),
    };
}

export function dayResource<T extends primitive.Timestamped>(
    path: string,
    stats: Stats<T> | undefined,
    year: string | undefined,
    month: string | undefined,
    day: string | undefined,
    hours: string[],
    dateParts: string = "{year}/{month}/{day}/{hour}"
) {
    if (!year || !month || !day || !hours.length) return;

    if (!stats?.min || !stats.max || !stats.median) return;

    return {
        $id: `${path}/${year}/${month}/${day}`,
        ...statsToSummary(`${path}/${dateParts}`, stats),
        data: hours.map((hour) => ({
            $ref: `${path}/${year}/${month}/${day}/${hour}`,
        })),
    };
}

export function hourBaseResource(path: string, timestamp: primitive.ISODateTimeString) {
    return {
        $id: setDateParts(`${path}/{year}/{month}/{day}/{hour}`, timestamp),
        timestamp,
    };
}
