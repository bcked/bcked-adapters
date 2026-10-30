import type { Stats } from "../../utils/stream";
import { setDateParts } from "../../utils/time";
import { icons } from "../utils/icons";
import { JsonResources } from "../utils/openapi";
import { type DailySeries } from "../utils/series";
import {
    dayResource,
    historyResource,
    hourBaseResource,
    monthResource,
    yearResource,
} from "../utils/resources";

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
            summary: {
                $ref: "/assets/summary",
            },
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
            series: {
                $ref: `/assets/${id}/series`,
            },
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
                $ref: `/assets/${id}/supply`,
            },
            "market-cap": {
                $ref: `/assets/${id}/market-cap`,
            },
            "underlying-assets": {
                $ref: `/assets/${id}/underlying-assets`,
            },
            "collateralization-ratio": {
                $ref: `/assets/${id}/collateralization-ratio`,
            },
            // "derivative-assets": {
            //     $ref: `/assets/${id}/derivative-assets`,
            // },
        };
    }

    @JsonResources.register({
        path: "/assets/summary",
        summary: "Get a summary of all assets",
        description:
            "Get details and latest values of all assets in one resource, including the relative change over 1, 7 and 30 days",
        type: "AssetSummary",
        // TODO write schema
        schema: {},
    })
    async summary(items: object[]) {
        return {
            $id: "/assets/summary",
            assets: items,
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/series",
        summary: "Get daily series of an asset",
        description:
            "Get the last value of each UTC day for all metrics of an asset as [date, value] pairs",
        type: "AssetSeries",
        // TODO write schema
        schema: {},
    })
    async series(id: string, series: Record<string, DailySeries | Record<string, DailySeries>>) {
        return {
            $id: `/assets/${id}/series`,
            ...series,
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/reports",
        summary: "Get the source of an asset's backing and its reports",
        description:
            "Get how the backing of an asset is obtained and, for backing from reports, every report with its month, SHA-256 hash and download URL. The reports themselves are not redistributed.",
        type: "AssetReports",
        // TODO write schema
        schema: {},
    })
    async reports(
        id: string,
        source: bcked.asset.BackingSource | null,
        reports: { report: string; file: string; sha256: string; url: string }[]
    ) {
        return {
            $id: `/assets/${id}/reports`,
            source,
            reports,
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
            name: details.name,
            symbol: details.symbol,
            identifier: {
                address: details.identifier.address,
                // TODO Map to system ref
                system: details.identifier.system,
            },
            assetClasses: details.assetClasses,
            // TODO Map to entity refs
            // TODO make list instead?
            linkedEntities: details.linkedEntities,
            reference: details.reference,
            tags: details.tags,
            backing: details.backing ?? null,
            warning: details.warning ?? null,
            listed: details.listed,
            updated: details.updated,
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
    async priceHistory<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        latestTimestamp: primitive.ISODateTimeString | undefined,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        return historyResource(`/assets/${id}/price`, latestTimestamp, stats, years);
    }

    @JsonResources.register({
        path: "/assets/{id}/price/{year}",
        summary: "Get price of an asset",
        description: "Get price of an asset by its ID",
        type: "AssetPrice",
        // TODO write schema
        schema: {},
    })
    async priceYear<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        months: string[]
    ) {
        return yearResource(`/assets/${id}/price`, stats, year, months);
    }

    @JsonResources.register({
        path: "/assets/{id}/price/{year}/{month}",
        summary: "Get price of an asset",
        description: "Get price of an asset by its ID",
        type: "AssetPrice",
        // TODO write schema
        schema: {},
    })
    async priceMonth<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) {
        return monthResource(`/assets/${id}/price`, stats, year, month, days);
    }

    @JsonResources.register({
        path: "/assets/{id}/price/{year}/{month}/{day}",
        summary: "Get price of an asset",
        description: "Get price of an asset by its ID",
        type: "AssetPrice",
        // TODO write schema
        schema: {},
    })
    async priceDay<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) {
        return dayResource(`/assets/${id}/price`, stats, year, month, day, hours);
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
        if (!stats?.min || !stats.max || !stats.median) return;

        return {
            ...hourBaseResource(`/assets/${id}/price`, stats.median.timestamp),
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
    async supplyHistory<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        latestTimestamp: primitive.ISODateTimeString | undefined,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        return historyResource(`/assets/${id}/supply`, latestTimestamp, stats, years);
    }

    @JsonResources.register({
        path: "/assets/{id}/supply/{year}",
        summary: "Get supply of an asset",
        description: "Get supply of an asset by its ID",
        type: "AssetSupply",
        // TODO write schema
        schema: {},
    })
    async supplyYear<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        months: string[]
    ) {
        return yearResource(`/assets/${id}/supply`, stats, year, months);
    }

    @JsonResources.register({
        path: "/assets/{id}/supply/{year}/{month}",
        summary: "Get supply of an asset",
        description: "Get supply of an asset by its ID",
        type: "AssetSupply",
        // TODO write schema
        schema: {},
    })
    async supplyMonth<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) {
        return monthResource(`/assets/${id}/supply`, stats, year, month, days);
    }

    @JsonResources.register({
        path: "/assets/{id}/supply/{year}/{month}/{day}",
        summary: "Get supply of an asset",
        description: "Get supply of an asset by its ID",
        type: "AssetSupply",
        // TODO write schema
        schema: {},
    })
    async supplyDay<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) {
        return dayResource(`/assets/${id}/supply`, stats, year, month, day, hours);
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
        if (!stats?.min || !stats.max || !stats.median) return;

        if (!stats.median.amount) return;

        return {
            ...hourBaseResource(`/assets/${id}/supply`, stats.median.timestamp),
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
    async marketCapHistory<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        latestTimestamp: primitive.ISODateTimeString | undefined,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        return historyResource(`/assets/${id}/market-cap`, latestTimestamp, stats, years);
    }

    @JsonResources.register({
        path: "/assets/{id}/market-cap/{year}",
        summary: "Get market cap of an asset",
        description: "Get market cap of an asset by its ID",
        type: "AssetMarketCap",
        // TODO write schema
        schema: {},
    })
    async marketCapYear<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        months: string[]
    ) {
        return yearResource(`/assets/${id}/market-cap`, stats, year, months);
    }

    @JsonResources.register({
        path: "/assets/{id}/market-cap/{year}/{month}",
        summary: "Get market cap of an asset",
        description: "Get market cap of an asset by its ID",
        type: "AssetMarketCap",
        // TODO write schema
        schema: {},
    })
    async marketCapMonth<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) {
        return monthResource(`/assets/${id}/market-cap`, stats, year, month, days);
    }

    @JsonResources.register({
        path: "/assets/{id}/market-cap/{year}/{month}/{day}",
        summary: "Get market cap of an asset",
        description: "Get market cap of an asset by its ID",
        type: "AssetMarketCap",
        // TODO write schema
        schema: {},
    })
    async marketCapDay<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) {
        return dayResource(`/assets/${id}/market-cap`, stats, year, month, day, hours);
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
        if (!stats?.min || !stats.max || !stats.median) return;

        return {
            ...hourBaseResource(`/assets/${id}/market-cap`, stats.median.timestamp),
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
    async underlyingAssetsHistory<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        latestTimestamp: primitive.ISODateTimeString | undefined,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        return historyResource(`/assets/${id}/underlying-assets`, latestTimestamp, stats, years);
    }

    @JsonResources.register({
        path: "/assets/{id}/underlying-assets/{year}",
        summary: "Get underlying assets of an asset",
        description: "Get underlying assets of an asset by its ID",
        type: "AssetUnderlyingAssets",
        // TODO write schema
        schema: {},
    })
    async underlyingAssetsYear<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        months: string[]
    ) {
        return yearResource(`/assets/${id}/underlying-assets`, stats, year, months);
    }

    @JsonResources.register({
        path: "/assets/{id}/underlying-assets/{year}/{month}",
        summary: "Get underlying assets of an asset",
        description: "Get underlying assets of an asset by its ID",
        type: "AssetUnderlyingAssets",
        // TODO write schema
        schema: {},
    })
    async underlyingAssetsMonth<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) {
        return monthResource(`/assets/${id}/underlying-assets`, stats, year, month, days);
    }

    @JsonResources.register({
        path: "/assets/{id}/underlying-assets/{year}/{month}/{day}",
        summary: "Get underlying assets of an asset",
        description: "Get underlying assets of an asset by its ID",
        type: "AssetUnderlyingAssets",
        // TODO write schema
        schema: {},
    })
    async underlyingAssetsDay<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) {
        return dayResource(`/assets/${id}/underlying-assets`, stats, year, month, day, hours);
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
        if (!stats?.min || !stats.max || !stats.median) return;

        return {
            ...hourBaseResource(`/assets/${id}/underlying-assets`, stats.median.timestamp),
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

    @JsonResources.register({
        path: "/assets/{id}/collateralization-ratio",
        summary: "Get collateralization ratio of an asset",
        description: "Get collateralization ratio of an asset by its ID",
        type: "AssetCollateralizationRatio",
        // TODO write schema
        schema: {},
    })
    async collateralizationRatioHistory<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        latestTimestamp: primitive.ISODateTimeString | undefined,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        return historyResource(
            `/assets/${id}/collateralization-ratio`,
            latestTimestamp,
            stats,
            years
        );
    }

    @JsonResources.register({
        path: "/assets/{id}/collateralization-ratio/{year}",
        summary: "Get collateralization ratio of an asset",
        description: "Get collateralization ratio of an asset by its ID",
        type: "AssetCollateralizationRatio",
        // TODO write schema
        schema: {},
    })
    async collateralizationRatioYear<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        months: string[]
    ) {
        return yearResource(`/assets/${id}/collateralization-ratio`, stats, year, months);
    }

    @JsonResources.register({
        path: "/assets/{id}/collateralization-ratio/{year}/{month}",
        summary: "Get collateralization ratio of an asset",
        description: "Get collateralization ratio of an asset by its ID",
        type: "AssetCollateralizationRatio",
        // TODO write schema
        schema: {},
    })
    async collateralizationRatioMonth<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) {
        return monthResource(`/assets/${id}/collateralization-ratio`, stats, year, month, days);
    }

    @JsonResources.register({
        path: "/assets/{id}/collateralization-ratio/{year}/{month}/{day}",
        summary: "Get collateralization ratio of an asset",
        description: "Get collateralization ratio of an asset by its ID",
        type: "AssetCollateralizationRatio",
        // TODO write schema
        schema: {},
    })
    async collateralizationRatioDay<T extends primitive.Timestamped>(
        id: bcked.entity.Id,
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) {
        return dayResource(`/assets/${id}/collateralization-ratio`, stats, year, month, day, hours);
    }

    @JsonResources.register({
        path: "/assets/{id}/collateralization-ratio/{year}/{month}/{day}/{hour}",
        summary: "Get collateralization ratio of an asset",
        description: "Get collateralization ratio of an asset by its ID",
        type: "AssetCollateralizationRatio",
        // TODO write schema
        schema: {},
    })
    async collateralizationRatioHour(
        id: bcked.entity.Id,
        stats: Stats<bcked.asset.Collateralization> | undefined
    ) {
        if (!stats?.min || !stats.max || !stats.median) return;

        return {
            ...hourBaseResource(`/assets/${id}/collateralization-ratio`, stats.median.timestamp),
            collateral: {
                $ref: setDateParts(
                    `/assets/${id}/underlying-assets/{year}/{month}/{day}/{hour}`,
                    stats.median.collateral.timestamp
                ),
            },
            marketCap: {
                $ref: setDateParts(
                    `/assets/${id}/market-cap/{year}/{month}/{day}/{hour}`,
                    stats.median.market_cap.timestamp
                ),
            },
            ratio: stats.median.ratio,
        };
    }
}

export const ASSET_RESOURCES = new Asset();
