"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hourBaseResource = exports.dayResource = exports.monthResource = exports.yearResource = exports.historyResource = exports.statsToSummary = void 0;
const time_1 = require("../../utils/time");
/**
 * Converts the statistics object to a summary object.
 * @param path - The path to set in the summary object, this includes which parts of the date to include e.g. `${path}/{year}/{month}/{day}/{hour}`.
 * @param stats - The statistics object containing min, max, and median values.
 * @returns The summary object with low, median, and high values.
 * @throws Error if the stats object is missing min, max, or median values.
 */
function statsToSummary(path, stats) {
    if (!stats.min || !stats.max || !stats.median) {
        throw new Error("Stats missing. This should have been checked prior.");
    }
    return {
        low: {
            $ref: (0, time_1.setDateParts)(path, stats.min.timestamp),
        },
        median: {
            $ref: (0, time_1.setDateParts)(path, stats.median.timestamp),
        },
        high: {
            $ref: (0, time_1.setDateParts)(path, stats.max.timestamp),
        },
    };
}
exports.statsToSummary = statsToSummary;
function historyResource(path, latestTimestamp, stats, years, dateParts = "{year}/{month}/{day}/{hour}") {
    if (!latestTimestamp || !stats || !stats.min || !stats.max || !stats.median || !years.length)
        return;
    return {
        $id: path,
        latest: {
            $ref: (0, time_1.setDateParts)(`${path}/${dateParts}`, latestTimestamp),
        },
        history: {
            ...statsToSummary(`${path}/${dateParts}`, stats),
            data: years.map((year) => ({
                $ref: `${path}/${year}`,
            })),
        },
    };
}
exports.historyResource = historyResource;
function yearResource(path, stats, year, months, dateParts = "{year}/{month}/{day}/{hour}") {
    if (!year || !months.length)
        return;
    if (!stats?.min || !stats.max || !stats.median)
        return;
    return {
        $id: `${path}/${year}`,
        ...statsToSummary(`${path}/${dateParts}`, stats),
        data: months.map((month) => ({
            $ref: `${path}/${year}/${month}`,
        })),
    };
}
exports.yearResource = yearResource;
function monthResource(path, stats, year, month, days, dateParts = "{year}/{month}/{day}/{hour}") {
    if (!year || !month || !days.length)
        return;
    if (!stats?.min || !stats.max || !stats.median)
        return;
    return {
        $id: `${path}/${year}/${month}`,
        ...statsToSummary(`${path}/${dateParts}`, stats),
        data: days.map((day) => ({
            $ref: `${path}/${year}/${month}/${day}`,
        })),
    };
}
exports.monthResource = monthResource;
function dayResource(path, stats, year, month, day, hours, dateParts = "{year}/{month}/{day}/{hour}") {
    if (!year || !month || !day || !hours.length)
        return;
    if (!stats?.min || !stats.max || !stats.median)
        return;
    return {
        $id: `${path}/${year}/${month}/${day}`,
        ...statsToSummary(`${path}/${dateParts}`, stats),
        data: hours.map((hour) => ({
            $ref: `${path}/${year}/${month}/${day}/${hour}`,
        })),
    };
}
exports.dayResource = dayResource;
function hourBaseResource(path, timestamp) {
    return {
        $id: (0, time_1.setDateParts)(`${path}/{year}/{month}/{day}/{hour}`, timestamp),
        timestamp,
    };
}
exports.hourBaseResource = hourBaseResource;
//# sourceMappingURL=resources.js.map