import { Stats } from "../../utils/stream";
import { setDateParts } from "../../utils/time";
import { icons } from "../utils/icons";
import { JsonResources } from "../utils/resources";

/**
 * Converts the statistics object to a summary object.
 * @param path - The path to set in the summary object, this includes which parts of the date to include e.g. `${path}/{year}/{month}/{day}/{hour}`.
 * @param stats - The statistics object containing min, max, and median values.
 * @returns The summary object with low, median, and high values.
 * @throws Error if the stats object is missing min, max, or median values.
 */
function statsToSummary<T extends primitive.Timestamped>(path: string, stats: Stats<T>) {
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

function historyResource<T extends primitive.Timestamped>(
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

function yearResource<T extends primitive.Timestamped>(
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

function monthResource<T extends primitive.Timestamped>(
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

function dayResource<T extends primitive.Timestamped>(
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

function hourBaseResource(path: string, timestamp: primitive.ISODateTimeString) {
    return {
        $id: setDateParts(`${path}/{year}/{month}/{day}/{hour}`, timestamp),
        timestamp,
    };
}
class System extends JsonResources {
    constructor() {
        super({
            name: "Systems",
            description: "Everything about systems",
            externalDocs: {
                description: "View on bcked.com",
                url: "https://bcked.com/systems",
            },
        });
    }

    @JsonResources.register({
        path: "/systems",
        summary: "Retrieve a list of systems",
        description: "Get a list of system IDs and references",
        type: "Systems",
        // TODO write schema
        schema: {},
    })
    async index(ids: bcked.system.Id[]) {
        return {
            $id: "/systems",
            systems: ids.map((id) => ({
                $ref: `/systems/${id}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/systems/{id}",
        summary: "Get a system",
        description: "Get an system by its ID",
        type: "System",
        // TODO write schema
        schema: {},
    })
    async system(id: bcked.system.Id) {
        return {
            $id: `/systems/${id}`,
            details: {
                $ref: `/systems/${id}/details`,
            },
            icons: {
                $ref: `/systems/${id}/icons`,
            },
            assets: {
                $ref: `/systems/${id}/assets`,
            },
            "total-value-locked": {
                $ref: `/systems/${id}/total-value-locked`,
            },
        };
    }

    @JsonResources.register({
        path: "/systems/{id}/details",
        summary: "Get details of a system",
        description: "Get details of a system by its ID",
        type: "SystemDetails",
        // TODO write schema
        schema: {},
    })
    async details(id: bcked.system.Id, details: bcked.system.DetailsRecord) {
        return {
            $id: `/systems/${id}/details`,
            name: details.name,
            // TODO reference to asset
            native: details.native,
            explorer: details.explorer,
            listed: details.listed,
            updated: details.updated,
        };
    }

    @JsonResources.register({
        path: "/systems/{id}/icons",
        summary: "Get icons of a system",
        description: "Get icons of a system by its ID",
        type: "SystemIcons",
        // TODO write schema
        schema: {},
    })
    async icons(id: bcked.system.Id) {
        return icons("systems", id);
    }

    @JsonResources.register({
        path: "/systems/{id}/assets",
        summary: "Get assets of a system",
        description: "Get assets of a system by its ID",
        type: "SystemAssets",
        // TODO write schema
        schema: {},
    })
    async assets(id: bcked.system.Id, assetIds: bcked.asset.Id[]) {
        return {
            $id: `/systems/${id}/assets`,
            assets: assetIds.map((assetId) => ({
                $ref: `/assets/${assetId}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/systems/{id}/total-value-locked",
        summary: "Get total value locked of an asset",
        description: "Get total value locked of an asset by its ID",
        type: "SystemTotalValueLocked",
        // TODO write schema
        schema: {},
    })
    async totalValueLockedHistory<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        latestTimestamp: primitive.ISODateTimeString | undefined,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        return historyResource(`/systems/${id}/total-value-locked`, latestTimestamp, stats, years);
    }
    @JsonResources.register({
        path: "/systems/{id}/total-value-locked/{year}",
        summary: "Get total value locked of an asset",
        description: "Get total value locked of an asset by its ID",
        type: "SystemTotalValueLocked",
        // TODO write schema
        schema: {},
    })
    async totalValueLockedYear<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        months: string[]
    ) {
        return yearResource(`/systems/${id}/total-value-locked`, stats, year, months);
    }
    @JsonResources.register({
        path: "/systems/{id}/total-value-locked/{year}/{month}",
        summary: "Get total value locked of an asset",
        description: "Get total value locked of an asset by its ID",
        type: "SystemTotalValueLocked",
        // TODO write schema
        schema: {},
    })
    async totalValueLockedMonth<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) {
        return monthResource(`/systems/${id}/total-value-locked`, stats, year, month, days);
    }
    @JsonResources.register({
        path: "/systems/{id}/total-value-locked/{year}/{month}/{day}",
        summary: "Get total value locked of an asset",
        description: "Get total value locked of an asset by its ID",
        type: "SystemTotalValueLocked",
        // TODO write schema
        schema: {},
    })
    async totalValueLockedDay<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) {
        return dayResource(`/systems/${id}/total-value-locked`, stats, year, month, day, hours);
    }
    @JsonResources.register({
        path: "/systems/{id}/total-value-locked/{year}/{month}/{day}/{hour}",
        summary: "Get total value locked of an asset",
        description: "Get total value locked of an asset by its ID",
        type: "SystemTotalValueLocked",
        // TODO write schema
        schema: {},
    })
    async totalValueLockedHour(
        id: bcked.entity.Id,
        stats: Stats<bcked.entity.TotalValueLocked> | undefined
    ) {
        if (!stats?.min || !stats.max || !stats.median) return;
        return {
            ...hourBaseResource(`/systems/${id}/total-value-locked`, stats.median.timestamp),
            value: {
                "rwa:USD": stats.median.totalValueLocked,
            },
        };
    }
}

export const SYSTEM_RESOURCES = new System();
