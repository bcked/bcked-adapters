import { Stats } from "../../utils/stream";
import { setDateParts } from "../../utils/time";
import { JsonResources } from "../utils/resources";
import { icons } from "./icons";

export class Asset extends JsonResources {
    constructor() {
        super({
            name: "Assets",
            description: "Everything about assets",
            externalDocs: {
                description: "View on bcked.com",
                url: "https://bcked.com/assets",
            },
        });
    }

    @JsonResources.register({
        path: "/assets",
        summary: "Retrieve a list of assets",
        description: "Get a list of asset IDs and references",
        type: "Assets",
        // TODO write schema
        schema: {},
    })
    async index(ids: bcked.asset.Id[]) {
        return {
            $id: "/assets",
            assets: ids.map((id) => ({
                $ref: `/assets/${id}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/assets/{id}",
        summary: "Get an asset",
        description: "Get an asset by its ID",
        type: "Asset",
        // TODO write schema
        schema: {},
    })
    async asset(id: bcked.asset.Id) {
        return {
            $id: `/assets/${id}`,
            details: {
                $ref: `/assets/${id}/details`,
            },
            icons: {
                $ref: `/assets/${id}/icons`,
            },
            price: {
                $ref: `/assets/${id}/price`,
            },
            supply: {
                $ref: `/assets/{id}/supply`,
            },
            // mcap: {
            //     $ref: `/assets/{id}/mcap`,
            // },
            // backing: {
            //     $ref: `/assets/${id}/backing`,
            // },
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/details",
        summary: "Get details of an asset",
        description: "Get details of an asset by its ID",
        type: "AssetDetails",
        // TODO write schema
        schema: {},
    })
    async details(id: bcked.asset.Id, details: bcked.asset.DetailsRecord) {
        return {
            $id: `/assets/${id}/details`,
            name: details?.name,
            symbol: details?.symbol,
            identifier: {
                address: details?.identifier.address,
                // TODO Map to system ref
                system: details?.identifier.system,
            },
            assetClasses: details?.assetClasses,
            // TODO Map to entity refs
            // TODO make list instead?
            linkedEntities: details?.linkedEntities,
            reference: details?.reference,
            tags: details?.tags,
            listed: details?.listed,
            updated: details?.updated,
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/icons",
        summary: "Get icons of an asset",
        description: "Get icons of an asset by its ID",
        type: "AssetIcons",
        // TODO write schema
        schema: {},
    })
    async icons(id: bcked.entity.Id) {
        return icons("assets", id);
    }

    @JsonResources.register({
        path: "/assets/{id}/price",
        summary: "Get price of an asset",
        description: "Get price of an asset by its ID",
        type: "AssetPrice",
        // TODO write schema
        schema: {},
    })
    async price(id: bcked.entity.Id) {
        return {
            $id: `/assets/${id}/price`,
            latest: {
                $ref: `/assets/${id}/price/latest`,
            },
            allTime: {
                $ref: `/assets/${id}/price/all-time`,
            },
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/price/latest",
        summary: "Get price of an asset",
        description: "Get price of an asset by its ID",
        type: "AssetPriceLatest",
        // TODO write schema
        schema: {},
    })
    async priceLatest(id: bcked.entity.Id, timestamp: primitive.ISODateTimeString | undefined) {
        if (!timestamp) return;

        return {
            $id: `/assets/${id}/price/latest`,
            $ref: setDateParts(`/assets/${id}/price/{year}/{month}/{day}/{hour}`, timestamp),
        };
    }

    statsToSummary<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T>
    ) {
        if (!stats || !stats.min || !stats.max || !stats.median) {
            throw new Error("Stats missing. This should have been checked prior.");
        }

        return {
            low: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.min.timestamp
                ),
            },
            median: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.median.timestamp
                ),
            },
            high: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.max.timestamp
                ),
            },
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/price/all-time",
        summary: "Get price of an asset",
        description: "Get price of an asset by its ID",
        type: "AssetPriceSummary",
        // TODO write schema
        schema: {},
    })
    async priceHistory<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        if (!stats || !stats.min || !stats.max || !stats.median || !years.length) return;

        return {
            $id: `/assets/${id}/price/all-time`,
            ...this.statsToSummary(id, stats),
            data: years.map((year) => ({
                $ref: `/assets/${id}/price/${year}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/price/{year}",
        summary: "Get price of an asset",
        description: "Get price of an asset by its ID",
        type: "AssetPriceSummary",
        // TODO write schema
        schema: {},
    })
    async priceYear<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        months: string[]
    ) {
        if (!year || !months.length) return;

        if (!stats || !stats.min || !stats.max || !stats.median) return;

        return {
            $id: `/assets/${id}/price/${year}`,
            ...this.statsToSummary(id, stats),
            data: months.map((month) => ({
                $ref: `/assets/${id}/price/${year}/${month}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/price/{year}/{month}",
        summary: "Get price of an asset",
        description: "Get price of an asset by its ID",
        type: "AssetPriceSummary",
        // TODO write schema
        schema: {},
    })
    async priceMonth<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) {
        if (!year || !month || !days.length) return;

        if (!stats || !stats.min || !stats.max || !stats.median) return;

        return {
            $id: `/assets/${id}/price/${year}/${month}`,
            ...this.statsToSummary(id, stats),
            data: days.map((day) => ({
                $ref: `/assets/${id}/price/${year}/${month}/${day}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/price/{year}/{month}/{day}",
        summary: "Get price of an asset",
        description: "Get price of an asset by its ID",
        type: "AssetPriceSummary",
        // TODO write schema
        schema: {},
    })
    async priceDay<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) {
        if (!year || !month || !day || !hours.length) return;

        if (!stats || !stats.min || !stats.max || !stats.median) return;

        return {
            $id: `/assets/${id}/price/${year}/${month}/${day}`,
            ...this.statsToSummary(id, stats),
            data: hours.map((hour) => ({
                $ref: `/assets/${id}/price/${year}/${month}/${day}/${hour}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/price/{year}/{month}/{day}/{hour}",
        summary: "Get price of an asset",
        description: "Get price of an asset by its ID",
        type: "AssetPrice",
        // TODO write schema
        schema: {},
    })
    async priceHour<T extends { timestamp: primitive.ISODateTimeString; usd: number }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined
    ) {
        if (!stats || !stats.min || !stats.max || !stats.median) return;

        return {
            $id: setDateParts(
                `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                stats.median.timestamp
            ),
            timestamp: stats.median.timestamp,
            value: {
                "rwa:USD": stats.median.usd,
            },
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/supply",
        summary: "Get supply of an asset",
        description: "Get supply of an asset by its ID",
        type: "AssetSupply",
        // TODO write schema
        schema: {},
    })
    async supply(id: bcked.entity.Id) {
        return {
            $id: `/assets/${id}/supply`,
            latest: {
                $ref: `/assets/${id}/supply/latest`,
            },
            allTime: {
                $ref: `/assets/${id}/supply/all-time`,
            },
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/supply/latest",
        summary: "Get supply of an asset",
        description: "Get supply of an asset by its ID",
        type: "AssetSupply",
        // TODO write schema
        schema: {},
    })
    async supplyLatest(id: bcked.entity.Id, timestamp: primitive.ISODateTimeString | undefined) {
        if (!timestamp) return;

        return {
            $id: `/assets/${id}/supply/latest`,
            $ref: setDateParts(`/assets/${id}/supply/{year}/{month}/{day}/{hour}`, timestamp),
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/supply/all-time",
        summary: "Get supply of an asset",
        description: "Get supply of an asset by its ID",
        type: "AssetSupply",
        // TODO write schema
        schema: {},
    })
    async supplyHistory<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        if (!stats || !stats.min || !stats.max || !stats.median || !years.length) return;

        return {
            $id: `/assets/${id}/supply/all-time`,
            ...this.statsToSummary(id, stats),
            data: years.map((year) => ({
                $ref: `/assets/${id}/supply/${year}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/supply/{year}",
        summary: "Get supply of an asset",
        description: "Get supply of an asset by its ID",
        type: "AssetSupply",
        // TODO write schema
        schema: {},
    })
    async supplyYear<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        months: string[]
    ) {
        if (!year || !months.length) return;

        if (!stats || !stats.min || !stats.max || !stats.median) return;

        return {
            $id: `/assets/${id}/supply/${year}`,
            ...this.statsToSummary(id, stats),
            data: months.map((month) => ({
                $ref: `/assets/${id}/supply/${year}/${month}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/supply/{year}/{month}",
        summary: "Get supply of an asset",
        description: "Get supply of an asset by its ID",
        type: "AssetSupply",
        // TODO write schema
        schema: {},
    })
    async supplyMonth<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) {
        if (!year || !month || !days.length) return;

        if (!stats || !stats.min || !stats.max || !stats.median) return;

        return {
            $id: `/assets/${id}/supply/${year}/${month}`,
            ...this.statsToSummary(id, stats),
            data: days.map((day) => ({
                $ref: `/assets/${id}/supply/${year}/${month}/${day}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/supply/{year}/{month}/{day}",
        summary: "Get supply of an asset",
        description: "Get supply of an asset by its ID",
        type: "AssetSupply",
        // TODO write schema
        schema: {},
    })
    async supplyDay<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) {
        if (!year || !month || !day || !hours.length) return;

        if (!stats || !stats.min || !stats.max || !stats.median) return;

        return {
            $id: `/assets/${id}/supply/${year}/${month}/${day}`,
            ...this.statsToSummary(id, stats),
            data: hours.map((hour) => ({
                $ref: `/assets/${id}/supply/${year}/${month}/${day}/${hour}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/supply/{year}/{month}/{day}/{hour}",
        summary: "Get supply of an asset",
        description: "Get supply of an asset by its ID",
        type: "AssetSupply",
        // TODO write schema
        schema: {},
    })
    async supplyHour<T extends { timestamp: primitive.ISODateTimeString; amount: number | null }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined
    ) {
        if (!stats || !stats.min || !stats.max || !stats.median) return;

        if (!stats.median.amount) return;

        return {
            $id: setDateParts(
                `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
                stats.median.timestamp
            ),
            timestamp: stats.median.timestamp,
            amount: stats.median.amount,
        };
    }
}

export const ASSET_RESOURCES = new Asset();
