import { Stats } from "../../utils/stream";
import { icons } from "../utils/icons";
import { JsonResources } from "../utils/openapi";
import {
    dayResource,
    historyResource,
    hourBaseResource,
    monthResource,
    yearResource,
} from "../utils/resources";

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
