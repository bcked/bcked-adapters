import { Stats } from "../../utils/stream";
import { setDateParts } from "../../utils/time";
import { icons } from "../utils/icons";
import { JsonResources } from "../utils/resources";

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
            "market-cap": {
                $ref: `/assets/{id}/market-cap`,
            },
            "underlying-assets": {
                $ref: `/assets/${id}/underlying-assets`,
            },
            // "derivative-assets": {
            //     $ref: `/assets/${id}/derivative-assets`,
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

    historyIndex(path: string) {
        return {
            $id: path,
            latest: {
                $ref: `${path}/latest`,
            },
            history: {
                $ref: `${path}/history`,
            },
        };
    }

    latest(path: string, timestamp: primitive.ISODateTimeString | undefined) {
        if (!timestamp) return;

        return {
            $id: `${path}/latest`,
            $ref: setDateParts(`${path}/{year}/{month}/{day}/{hour}`, timestamp),
        };
    }

    statsToSummary<T extends { timestamp: primitive.ISODateTimeString }>(
        path: string,
        stats: Stats<T>
    ) {
        if (!stats || !stats.min || !stats.max || !stats.median) {
            throw new Error("Stats missing. This should have been checked prior.");
        }

        return {
            low: {
                $ref: setDateParts(`${path}/{year}/{month}/{day}/{hour}`, stats.min.timestamp),
            },
            median: {
                $ref: setDateParts(`${path}/{year}/{month}/{day}/{hour}`, stats.median.timestamp),
            },
            high: {
                $ref: setDateParts(`${path}/{year}/{month}/{day}/{hour}`, stats.max.timestamp),
            },
        };
    }

    history<T extends { timestamp: primitive.ISODateTimeString }>(
        path: string,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        if (!stats || !stats.min || !stats.max || !stats.median || !years.length) return;

        return {
            $id: `${path}/history`,
            ...this.statsToSummary(path, stats),
            data: years.map((year) => ({
                $ref: `${path}/${year}`,
            })),
        };
    }

    year<T extends { timestamp: primitive.ISODateTimeString }>(
        path: string,
        stats: Stats<T> | undefined,
        year: string | undefined,
        months: string[]
    ) {
        if (!year || !months.length) return;

        if (!stats || !stats.min || !stats.max || !stats.median) return;

        return {
            $id: `${path}/${year}`,
            ...this.statsToSummary(path, stats),
            data: months.map((month) => ({
                $ref: `${path}/${year}/${month}`,
            })),
        };
    }

    month<T extends { timestamp: primitive.ISODateTimeString }>(
        path: string,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) {
        if (!year || !month || !days.length) return;

        if (!stats || !stats.min || !stats.max || !stats.median) return;

        return {
            $id: `${path}/${year}/${month}`,
            ...this.statsToSummary(path, stats),
            data: days.map((day) => ({
                $ref: `${path}/${year}/${month}/${day}`,
            })),
        };
    }

    day<T extends { timestamp: primitive.ISODateTimeString }>(
        path: string,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) {
        if (!year || !month || !day || !hours.length) return;

        if (!stats || !stats.min || !stats.max || !stats.median) return;

        return {
            $id: `${path}/${year}/${month}/${day}`,
            ...this.statsToSummary(path, stats),
            data: hours.map((hour) => ({
                $ref: `${path}/${year}/${month}/${day}/${hour}`,
            })),
        };
    }

    hourBase(path: string, timestamp: primitive.ISODateTimeString) {
        return {
            $id: setDateParts(`${path}/{year}/{month}/{day}/{hour}`, timestamp),
            timestamp,
        };
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
        return this.historyIndex(`/assets/${id}/price`);
    }

    @JsonResources.register({
        path: "/assets/{id}/price/latest",
        summary: "Get price of an asset",
        description: "Get price of an asset by its ID",
        type: "AssetPrice",
        // TODO write schema
        schema: {},
    })
    async priceLatest(id: bcked.entity.Id, timestamp: primitive.ISODateTimeString | undefined) {
        return this.latest(`/assets/${id}/price`, timestamp);
    }

    @JsonResources.register({
        path: "/assets/{id}/price/history",
        summary: "Get price of an asset",
        description: "Get price of an asset by its ID",
        type: "AssetPrice",
        // TODO write schema
        schema: {},
    })
    async priceHistory<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        return this.history(`/assets/${id}/price`, stats, years);
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
        return this.year(`/assets/${id}/price`, stats, year, months);
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
        return this.month(`/assets/${id}/price`, stats, year, month, days);
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
        return this.day(`/assets/${id}/price`, stats, year, month, day, hours);
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
            ...this.hourBase(`/assets/${id}/price`, stats.median.timestamp),
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
        return this.historyIndex(`/assets/${id}/supply`);
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
        return this.latest(`/assets/${id}/supply`, timestamp);
    }

    @JsonResources.register({
        path: "/assets/{id}/supply/history",
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
        return this.history(`/assets/${id}/supply`, stats, years);
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
        return this.year(`/assets/${id}/supply`, stats, year, months);
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
        return this.month(`/assets/${id}/supply`, stats, year, month, days);
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
        return this.day(`/assets/${id}/supply`, stats, year, month, day, hours);
    }

    @JsonResources.register({
        path: "/assets/{id}/supply/{year}/{month}/{day}/{hour}",
        summary: "Get supply of an asset",
        description: "Get supply of an asset by its ID",
        type: "AssetSupply",
        // TODO write schema
        schema: {},
    })
    async supplyHour(id: bcked.entity.Id, stats: Stats<bcked.asset.SupplyAmount> | undefined) {
        if (!stats || !stats.min || !stats.max || !stats.median) return;

        if (!stats.median.amount) return;

        return {
            ...this.hourBase(`/assets/${id}/supply`, stats.median.timestamp),
            circulating: stats.median.circulating, // Circulating = Issued - Locked - Burned; If unknown, this must be set to null.
            burned: stats.median.burned, // If unknown, this must be set to null.
            total: stats.median.total, // Total = Circulating + Locked = Issued - Burned; If unknown, this must be set to null.
            issued: stats.median.issued, // If unknown, this must be set to null.
            max: stats.median.max, // Maximum number of supply; If unknown or N/A, this must be set to null.
            amount: stats.median.amount, // Amount of supply given a fallback logic.
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/market-cap",
        summary: "Get market cap of an asset",
        description: "Get market cap of an asset by its ID",
        type: "AssetMarketCap",
        // TODO write schema
        schema: {},
    })
    async marketCap(id: bcked.entity.Id) {
        return this.historyIndex(`/assets/${id}/market-cap`);
    }

    @JsonResources.register({
        path: "/assets/{id}/market-cap/latest",
        summary: "Get market cap of an asset",
        description: "Get market cap of an asset by its ID",
        type: "AssetMarketCap",
        // TODO write schema
        schema: {},
    })
    async marketCapLatest(id: bcked.entity.Id, timestamp: primitive.ISODateTimeString | undefined) {
        return this.latest(`/assets/${id}/market-cap`, timestamp);
    }

    @JsonResources.register({
        path: "/assets/{id}/market-cap/history",
        summary: "Get market cap of an asset",
        description: "Get market cap of an asset by its ID",
        type: "AssetMarketCap",
        // TODO write schema
        schema: {},
    })
    async marketCapHistory<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        return this.history(`/assets/${id}/market-cap`, stats, years);
    }

    @JsonResources.register({
        path: "/assets/{id}/market-cap/{year}",
        summary: "Get market cap of an asset",
        description: "Get market cap of an asset by its ID",
        type: "AssetMarketCap",
        // TODO write schema
        schema: {},
    })
    async marketCapYear<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        months: string[]
    ) {
        return this.year(`/assets/${id}/market-cap`, stats, year, months);
    }

    @JsonResources.register({
        path: "/assets/{id}/market-cap/{year}/{month}",
        summary: "Get market cap of an asset",
        description: "Get market cap of an asset by its ID",
        type: "AssetMarketCap",
        // TODO write schema
        schema: {},
    })
    async marketCapMonth<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) {
        return this.month(`/assets/${id}/market-cap`, stats, year, month, days);
    }

    @JsonResources.register({
        path: "/assets/{id}/market-cap/{year}/{month}/{day}",
        summary: "Get market cap of an asset",
        description: "Get market cap of an asset by its ID",
        type: "AssetMarketCap",
        // TODO write schema
        schema: {},
    })
    async marketCapDay<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) {
        return this.day(`/assets/${id}/market-cap`, stats, year, month, day, hours);
    }

    @JsonResources.register({
        path: "/assets/{id}/market-cap/{year}/{month}/{day}/{hour}",
        summary: "Get market cap of an asset",
        description: "Get market cap of an asset by its ID",
        type: "AssetMarketCap",
        // TODO write schema
        schema: {},
    })
    async marketCapHour(id: bcked.entity.Id, stats: Stats<bcked.asset.MarketCap> | undefined) {
        if (!stats || !stats.min || !stats.max || !stats.median) return;

        return {
            ...this.hourBase(`/assets/${id}/market-cap`, stats.median.timestamp),
            price: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.median.price.timestamp
                ),
            },
            supply: {
                $ref: setDateParts(
                    `/assets/${id}/supply/{year}/{month}/{day}/{hour}`,
                    stats.median.supply.timestamp
                ),
            },
            value: {
                "rwa:USD": stats.median.usd,
            },
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/underlying-assets",
        summary: "Get underlying assets of an asset",
        description: "Get underlying assets of an asset by its ID",
        type: "AssetUnderlyingAssets",
        // TODO write schema
        schema: {},
    })
    async underlyingAssets(id: bcked.entity.Id) {
        return this.historyIndex(`/assets/${id}/underlying-assets`);
    }

    @JsonResources.register({
        path: "/assets/{id}/underlying-assets/latest",
        summary: "Get latest underlying assets of an asset",
        description: "Get latest underlying assets of an asset by its ID",
        type: "AssetUnderlyingAssets",
        // TODO write schema
        schema: {},
    })
    async underlyingAssetsLatest(
        id: bcked.entity.Id,
        timestamp: primitive.ISODateTimeString | undefined
    ) {
        return this.latest(`/assets/${id}/underlying-assets`, timestamp);
    }

    @JsonResources.register({
        path: "/assets/{id}/underlying-assets/history",
        summary: "Get historical underlying assets of an asset",
        description: "Get historical underlying assets of an asset by its ID",
        type: "AssetUnderlyingAssets",
        // TODO write schema
        schema: {},
    })
    async underlyingAssetsHistory<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        return this.history(`/assets/${id}/underlying-assets`, stats, years);
    }

    @JsonResources.register({
        path: "/assets/{id}/underlying-assets/{year}",
        summary: "Get underlying assets of an asset",
        description: "Get underlying assets of an asset by its ID",
        type: "AssetUnderlyingAssets",
        // TODO write schema
        schema: {},
    })
    async underlyingAssetsYear<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        months: string[]
    ) {
        return this.year(`/assets/${id}/underlying-assets`, stats, year, months);
    }

    @JsonResources.register({
        path: "/assets/{id}/underlying-assets/{year}/{month}",
        summary: "Get underlying assets of an asset",
        description: "Get underlying assets of an asset by its ID",
        type: "AssetUnderlyingAssets",
        // TODO write schema
        schema: {},
    })
    async underlyingAssetsMonth<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) {
        return this.month(`/assets/${id}/underlying-assets`, stats, year, month, days);
    }

    @JsonResources.register({
        path: "/assets/{id}/underlying-assets/{year}/{month}/{day}",
        summary: "Get underlying assets of an asset",
        description: "Get underlying assets of an asset by its ID",
        type: "AssetUnderlyingAssets",
        // TODO write schema
        schema: {},
    })
    async underlyingAssetsDay<T extends { timestamp: primitive.ISODateTimeString }>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) {
        return this.day(`/assets/${id}/underlying-assets`, stats, year, month, day, hours);
    }

    @JsonResources.register({
        path: "/assets/{id}/underlying-assets/{year}/{month}/{day}/{hour}",
        summary: "Get underlying assets of an asset",
        description: "Get underlying assets of an asset by its ID",
        type: "AssetUnderlyingAssets",
        // TODO write schema
        schema: {},
    })
    async underlyingAssetsHour(
        id: bcked.entity.Id,
        stats: Stats<bcked.asset.Relationships> | undefined
    ) {
        if (!stats || !stats.min || !stats.max || !stats.median) return;

        return {
            ...this.hourBase(`/assets/${id}/underlying-assets`, stats.median.timestamp),
            breakdown: Object.entries(stats.median.breakdown).map(([assetId, underlying]) => ({
                asset: {
                    $ref: `/assets/${assetId}`,
                },
                amount: underlying.amount,
                // TODO what about the graph?
                // TODO How to handle non-matching timepoints within the backing tree?
                ...(underlying.price
                    ? {
                          price: {
                              $ref: setDateParts(
                                  `/assets/${assetId}/price/{year}/{month}/{day}/{hour}`,
                                  underlying.price.timestamp
                              ),
                          },
                          value: {
                              "rwa:USD": underlying.usd,
                          },
                      }
                    : {}),
            })),
            total: {
                "rwa:USD": stats.median.usd,
            },
        };
    }
}

export const ASSET_RESOURCES = new Asset();
