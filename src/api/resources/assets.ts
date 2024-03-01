import type { Stats } from "../../utils/stream";
import { setDateParts } from "../../utils/time";
import { icons } from "../utils/icons";
import { JsonResources } from "../utils/resources";

function statsToSummary<T extends primitive.Timestamped>(path: string, stats: Stats<T>) {
    if (!stats.min || !stats.max || !stats.median) {
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

function historyResource<T extends primitive.Timestamped>(
    path: string,
    latestTimestamp: primitive.ISODateTimeString | undefined,
    stats: Stats<T> | undefined,
    years: string[]
) {
    if (!latestTimestamp || !stats || !stats.min || !stats.max || !stats.median || !years.length)
        return;

    return {
        $id: path,
        latest: {
            $ref: setDateParts(`${path}/{year}/{month}/{day}/{hour}`, latestTimestamp),
        },
        history: {
            ...statsToSummary(path, stats),
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
    months: string[]
) {
    if (!year || !months.length) return;

    if (!stats?.min || !stats.max || !stats.median) return;

    return {
        $id: `${path}/${year}`,
        ...statsToSummary(path, stats),
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
    days: string[]
) {
    if (!year || !month || !days.length) return;

    if (!stats?.min || !stats.max || !stats.median) return;

    return {
        $id: `${path}/${year}/${month}`,
        ...statsToSummary(path, stats),
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
    hours: string[]
) {
    if (!year || !month || !day || !hours.length) return;

    if (!stats?.min || !stats.max || !stats.median) return;

    return {
        $id: `${path}/${year}/${month}/${day}`,
        ...statsToSummary(path, stats),
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
            "collateralization-graph": {
                $ref: `/assets/collateralization-graph`,
            },
        };
    }

    @JsonResources.register({
        path: "/assets/collateralization-graph",
        summary: "Get collateralization graph",
        description: "Get the global collateralization graph of all assets",
        type: "CollateralizationGraph",
        // TODO write schema
        schema: {},
    })
    async collateralizationGraphHistory<T extends primitive.Timestamped>(
        latestTimestamp: primitive.ISODateTimeString | undefined,
        stats: Stats<T> | undefined,
        years: string[]
    ) {
        return historyResource("/assets/collateralization-graph", latestTimestamp, stats, years);
    }

    @JsonResources.register({
        path: "/assets/collateralization-graph/{year}",
        summary: "Get collateralization graph for a specific year",
        description: "Get the collateralization graph of all assets for a specific year",
        type: "CollateralizationGraph",
        // TODO write schema
        schema: {},
    })
    async collateralizationGraphYear<T extends primitive.Timestamped>(
        stats: Stats<T> | undefined,
        year: string | undefined,
        months: string[]
    ) {
        return yearResource("/assets/collateralization-graph", stats, year, months);
    }

    @JsonResources.register({
        path: "/assets/collateralization-graph/{year}/{month}",
        summary: "Get collateralization graph for a specific month",
        description: "Get the collateralization graph of all assets for a specific month",
        type: "CollateralizationGraph",
        // TODO write schema
        schema: {},
    })
    async collateralizationGraphMonth<T extends primitive.Timestamped>(
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        days: string[]
    ) {
        return monthResource("/assets/collateralization-graph", stats, year, month, days);
    }

    @JsonResources.register({
        path: "/assets/collateralization-graph/{year}/{month}/{day}",
        summary: "Get collateralization graph for a specific day",
        description: "Get the collateralization graph of all assets for a specific day",
        type: "CollateralizationGraph",
        // TODO write schema
        schema: {},
    })
    async collateralizationGraphDay<T extends primitive.Timestamped>(
        stats: Stats<T> | undefined,
        year: string | undefined,
        month: string | undefined,
        day: string | undefined,
        hours: string[]
    ) {
        return dayResource("/assets/collateralization-graph", stats, year, month, day, hours);
    }

    @JsonResources.register({
        path: "/assets/collateralization-graph/{year}/{month}/{day}/{hour}",
        summary: "Get collateralization graph for a specific hour",
        description: "Get the collateralization graph of all assets for a specific hour",
        type: "CollateralizationGraph",
        // TODO write schema
        schema: {},
    })
    async collateralizationGraphHour<T extends primitive.Timestamped & bcked.asset.Graph>(
        stats: Stats<T> | undefined
    ) {
        if (!stats?.min || !stats.max || !stats.median) return;

        return {
            ...hourBaseResource(`/assets/collateralization-graph`, stats.median.timestamp),
            graph: {
                nodes: stats.median.graph.nodes
                    .filter((node) => node.id) // TODO Somehow there are nodes without ID
                    .map((node) => ({
                        id: node.id,
                        data: {
                            asset: {
                                $ref: `/assets/${node.id}`,
                            },
                            "collateralization-ratio": node.data?.value
                                ? {
                                      $ref: setDateParts(
                                          `/assets/${node.id}/collateralization-ratio/{year}/{month}/{day}/{hour}`,
                                          node.data.timestamp
                                      ),
                                  }
                                : undefined,
                            value: node.data?.value
                                ? {
                                      "rwa:USD": node.data.value,
                                  }
                                : undefined,
                        },
                    })),
                links: stats.median.graph.links
                    .filter((link) => link.fromId && link.toId) // TODO Somehow there are links without ID
                    .map((link) => ({
                        fromId: link.fromId,
                        toId: link.toId,
                        data: {
                            value: {
                                "rwa:USD": link.data.value,
                            },
                        },
                    })),
            },
            stats: stats.median.stats,
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
