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

class Entity extends JsonResources {
    constructor() {
        super({
            name: "Entities",
            description: "Everything about entities",
            externalDocs: {
                description: "View on bcked.com",
                url: "https://bcked.com/entities",
            },
        });
    }

    @JsonResources.register({
        path: "/entities",
        summary: "Retrieve a list of entities",
        description: "Get a list of entity IDs and references",
        type: "Entities",
        // TODO write schema
        schema: {},
    })
    async index(ids: bcked.entity.Id[]) {
        return {
            $id: "/entities",
            entities: ids.map((id) => ({
                $ref: `/entities/${id}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/entities/{id}",
        summary: "Get a entity",
        description: "Get an entity by its ID",
        type: "Entity",
        // TODO write schema
        schema: {},
    })
    async entity(id: bcked.entity.Id) {
        return {
            $id: `/entities/${id}`,
            details: {
                $ref: `/entities/${id}/details`,
            },
            icons: {
                $ref: `/entities/${id}/icons`,
            },
            assets: {
                $ref: `/entities/${id}/assets`,
            },
            "total-value-locked": {
                $ref: `/entities/${id}/total-value-locked`,
            },
        };
    }

    @JsonResources.register({
        path: "/entities/{id}/details",
        summary: "Get details of a entity",
        description: "Get details of a entity by its ID",
        type: "EntityDetails",
        // TODO write schema
        schema: {},
    })
    async details(id: bcked.entity.Id, details: bcked.entity.DetailsRecord) {
        return {
            $id: `/entities/${id}/details`,
            name: details.name,
            identifier: details.identifier,
            reference: details.reference,
            tags: details.tags,
            listed: details.listed,
            updated: details.updated,
        };
    }

    @JsonResources.register({
        path: "/entities/{id}/icons",
        summary: "Get icons of a entity",
        description: "Get icons of a entity by its ID",
        type: "EntityIcons",
        // TODO write schema
        schema: {},
    })
    async icons(id: bcked.entity.Id) {
        return icons("entities", id);
    }

    @JsonResources.register({
        path: "/entities/{id}/assets",
        summary: "Get assets of a entity",
        description: "Get assets of a entity by its ID",
        type: "EntityAssets",
        // TODO write schema
        schema: {},
    })
    async assets(id: bcked.entity.Id, assetIds: bcked.asset.Id[]) {
        return {
            $id: `/entities/${id}/assets`,
            assets: assetIds.map((assetId) => ({
                $ref: `/assets/${assetId}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/entities/{id}/total-value-locked",
        summary: "Get total value locked of an asset",
        description: "Get total value locked of an asset by its ID",
        type: "AssetTotalValueLocked",
        // TODO write schema
        schema: {},
    })
    async totalValueLockedHistory<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        latestTimestamp: primitive.ISODateTimeString | undefined,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        return historyResource(`/entities/${id}/total-value-locked`, latestTimestamp, stats, years);
    }
    @JsonResources.register({
        path: "/entities/{id}/total-value-locked/{year}",
        summary: "Get total value locked of an asset",
        description: "Get total value locked of an asset by its ID",
        type: "AssetTotalValueLocked",
        // TODO write schema
        schema: {},
    })
    async totalValueLockedYear<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        months: string[]
    ) {
        return yearResource(`/entities/${id}/total-value-locked`, stats, year, months);
    }
    @JsonResources.register({
        path: "/entities/{id}/total-value-locked/{year}/{month}",
        summary: "Get total value locked of an asset",
        description: "Get total value locked of an asset by its ID",
        type: "AssetTotalValueLocked",
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
        return monthResource(`/entities/${id}/total-value-locked`, stats, year, month, days);
    }
    @JsonResources.register({
        path: "/entities/{id}/total-value-locked/{year}/{month}/{day}",
        summary: "Get total value locked of an asset",
        description: "Get total value locked of an asset by its ID",
        type: "AssetTotalValueLocked",
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
        return dayResource(`/entities/${id}/total-value-locked`, stats, year, month, day, hours);
    }
    @JsonResources.register({
        path: "/entities/{id}/total-value-locked/{year}/{month}/{day}/{hour}",
        summary: "Get total value locked of an asset",
        description: "Get total value locked of an asset by its ID",
        type: "AssetTotalValueLocked",
        // TODO write schema
        schema: {},
    })
    async totalValueLockedHour(
        id: bcked.entity.Id,
        stats: Stats<bcked.entity.TotalValueLocked> | undefined
    ) {
        if (!stats?.min || !stats.max || !stats.median) return;
        return {
            ...hourBaseResource(`/entities/${id}/total-value-locked`, stats.median.timestamp),
            value: {
                "rwa:USD": stats.median.totalValueLocked,
            },
        };
    }
}

export const ENTITY_RESOURCES = new Entity();
