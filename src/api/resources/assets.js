"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASSET_RESOURCES = exports.Asset = void 0;
const time_1 = require("../../utils/time");
const icons_1 = require("../utils/icons");
const resources_1 = require("../utils/resources");
function statsToSummary(path, stats) {
    if (!stats.min || !stats.max || !stats.median) {
        throw new Error("Stats missing. This should have been checked prior.");
    }
    return {
        low: {
            $ref: (0, time_1.setDateParts)(`${path}/{year}/{month}/{day}/{hour}`, stats.min.timestamp),
        },
        median: {
            $ref: (0, time_1.setDateParts)(`${path}/{year}/{month}/{day}/{hour}`, stats.median.timestamp),
        },
        high: {
            $ref: (0, time_1.setDateParts)(`${path}/{year}/{month}/{day}/{hour}`, stats.max.timestamp),
        },
    };
}
function historyResource(path, latestTimestamp, stats, years) {
    if (!latestTimestamp || !stats || !stats.min || !stats.max || !stats.median || !years.length)
        return;
    return {
        $id: path,
        latest: {
            $ref: (0, time_1.setDateParts)(`${path}/{year}/{month}/{day}/{hour}`, latestTimestamp),
        },
        history: {
            ...statsToSummary(path, stats),
            data: years.map((year) => ({
                $ref: `${path}/${year}`,
            })),
        },
    };
}
function yearResource(path, stats, year, months) {
    if (!year || !months.length)
        return;
    if (!stats?.min || !stats.max || !stats.median)
        return;
    return {
        $id: `${path}/${year}`,
        ...statsToSummary(path, stats),
        data: months.map((month) => ({
            $ref: `${path}/${year}/${month}`,
        })),
    };
}
function monthResource(path, stats, year, month, days) {
    if (!year || !month || !days.length)
        return;
    if (!stats?.min || !stats.max || !stats.median)
        return;
    return {
        $id: `${path}/${year}/${month}`,
        ...statsToSummary(path, stats),
        data: days.map((day) => ({
            $ref: `${path}/${year}/${month}/${day}`,
        })),
    };
}
function dayResource(path, stats, year, month, day, hours) {
    if (!year || !month || !day || !hours.length)
        return;
    if (!stats?.min || !stats.max || !stats.median)
        return;
    return {
        $id: `${path}/${year}/${month}/${day}`,
        ...statsToSummary(path, stats),
        data: hours.map((hour) => ({
            $ref: `${path}/${year}/${month}/${day}/${hour}`,
        })),
    };
}
function hourBaseResource(path, timestamp) {
    return {
        $id: (0, time_1.setDateParts)(`${path}/{year}/{month}/{day}/{hour}`, timestamp),
        timestamp,
    };
}
let Asset = exports.Asset = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _index_decorators;
    let _collateralizationGraphHistory_decorators;
    let _collateralizationGraphYear_decorators;
    let _collateralizationGraphMonth_decorators;
    let _collateralizationGraphDay_decorators;
    let _collateralizationGraphHour_decorators;
    let _asset_decorators;
    let _details_decorators;
    let _icons_decorators;
    let _priceHistory_decorators;
    let _priceYear_decorators;
    let _priceMonth_decorators;
    let _priceDay_decorators;
    let _priceHour_decorators;
    let _supplyHistory_decorators;
    let _supplyYear_decorators;
    let _supplyMonth_decorators;
    let _supplyDay_decorators;
    let _supplyHour_decorators;
    let _marketCapHistory_decorators;
    let _marketCapYear_decorators;
    let _marketCapMonth_decorators;
    let _marketCapDay_decorators;
    let _marketCapHour_decorators;
    let _underlyingAssetsHistory_decorators;
    let _underlyingAssetsYear_decorators;
    let _underlyingAssetsMonth_decorators;
    let _underlyingAssetsDay_decorators;
    let _underlyingAssetsHour_decorators;
    let _collateralizationRatioHistory_decorators;
    let _collateralizationRatioYear_decorators;
    let _collateralizationRatioMonth_decorators;
    let _collateralizationRatioDay_decorators;
    let _collateralizationRatioHour_decorators;
    return _a = class Asset extends resources_1.JsonResources {
            constructor() {
                super({
                    name: "Assets",
                    description: "Everything about assets",
                    externalDocs: {
                        description: "View on bcked.com",
                        url: "https://bcked.com/assets",
                    },
                });
                __runInitializers(this, _instanceExtraInitializers);
            }
            async index(ids) {
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
            async collateralizationGraphHistory(latestTimestamp, stats, years) {
                return historyResource("/assets/collateralization-graph", latestTimestamp, stats, years);
            }
            async collateralizationGraphYear(stats, year, months) {
                return yearResource("/assets/collateralization-graph", stats, year, months);
            }
            async collateralizationGraphMonth(stats, year, month, days) {
                return monthResource("/assets/collateralization-graph", stats, year, month, days);
            }
            async collateralizationGraphDay(stats, year, month, day, hours) {
                return dayResource("/assets/collateralization-graph", stats, year, month, day, hours);
            }
            async collateralizationGraphHour(stats) {
                if (!stats?.min || !stats.max || !stats.median)
                    return;
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
                                        $ref: (0, time_1.setDateParts)(`/assets/${node.id}/collateralization-ratio/{year}/{month}/{day}/{hour}`, node.data.timestamp),
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
            async asset(id) {
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
            async details(id, details) {
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
            async icons(id) {
                return (0, icons_1.icons)("assets", id);
            }
            async priceHistory(id, latestTimestamp, stats, years) {
                return historyResource(`/assets/${id}/price`, latestTimestamp, stats, years);
            }
            async priceYear(id, stats, year, months) {
                return yearResource(`/assets/${id}/price`, stats, year, months);
            }
            async priceMonth(id, stats, year, month, days) {
                return monthResource(`/assets/${id}/price`, stats, year, month, days);
            }
            async priceDay(id, stats, year, month, day, hours) {
                return dayResource(`/assets/${id}/price`, stats, year, month, day, hours);
            }
            async priceHour(id, stats) {
                if (!stats?.min || !stats.max || !stats.median)
                    return;
                return {
                    ...hourBaseResource(`/assets/${id}/price`, stats.median.timestamp),
                    value: {
                        "rwa:USD": stats.median.usd,
                    },
                };
            }
            async supplyHistory(id, latestTimestamp, stats, years) {
                return historyResource(`/assets/${id}/supply`, latestTimestamp, stats, years);
            }
            async supplyYear(id, stats, year, months) {
                return yearResource(`/assets/${id}/supply`, stats, year, months);
            }
            async supplyMonth(id, stats, year, month, days) {
                return monthResource(`/assets/${id}/supply`, stats, year, month, days);
            }
            async supplyDay(id, stats, year, month, day, hours) {
                return dayResource(`/assets/${id}/supply`, stats, year, month, day, hours);
            }
            async supplyHour(id, stats) {
                if (!stats?.min || !stats.max || !stats.median)
                    return;
                if (!stats.median.amount)
                    return;
                return {
                    ...hourBaseResource(`/assets/${id}/supply`, stats.median.timestamp),
                    circulating: stats.median.circulating,
                    burned: stats.median.burned,
                    total: stats.median.total,
                    issued: stats.median.issued,
                    max: stats.median.max,
                    amount: stats.median.amount, // Amount of supply given a fallback logic.
                };
            }
            async marketCapHistory(id, latestTimestamp, stats, years) {
                return historyResource(`/assets/${id}/market-cap`, latestTimestamp, stats, years);
            }
            async marketCapYear(id, stats, year, months) {
                return yearResource(`/assets/${id}/market-cap`, stats, year, months);
            }
            async marketCapMonth(id, stats, year, month, days) {
                return monthResource(`/assets/${id}/market-cap`, stats, year, month, days);
            }
            async marketCapDay(id, stats, year, month, day, hours) {
                return dayResource(`/assets/${id}/market-cap`, stats, year, month, day, hours);
            }
            async marketCapHour(id, stats) {
                if (!stats?.min || !stats.max || !stats.median)
                    return;
                return {
                    ...hourBaseResource(`/assets/${id}/market-cap`, stats.median.timestamp),
                    price: {
                        $ref: (0, time_1.setDateParts)(`/assets/${id}/price/{year}/{month}/{day}/{hour}`, stats.median.price.timestamp),
                    },
                    supply: {
                        $ref: (0, time_1.setDateParts)(`/assets/${id}/supply/{year}/{month}/{day}/{hour}`, stats.median.supply.timestamp),
                    },
                    value: {
                        "rwa:USD": stats.median.usd,
                    },
                };
            }
            async underlyingAssetsHistory(id, latestTimestamp, stats, years) {
                return historyResource(`/assets/${id}/underlying-assets`, latestTimestamp, stats, years);
            }
            async underlyingAssetsYear(id, stats, year, months) {
                return yearResource(`/assets/${id}/underlying-assets`, stats, year, months);
            }
            async underlyingAssetsMonth(id, stats, year, month, days) {
                return monthResource(`/assets/${id}/underlying-assets`, stats, year, month, days);
            }
            async underlyingAssetsDay(id, stats, year, month, day, hours) {
                return dayResource(`/assets/${id}/underlying-assets`, stats, year, month, day, hours);
            }
            async underlyingAssetsHour(id, stats) {
                if (!stats?.min || !stats.max || !stats.median)
                    return;
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
                                    $ref: (0, time_1.setDateParts)(`/assets/${assetId}/price/{year}/{month}/{day}/{hour}`, underlying.price.timestamp),
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
            async collateralizationRatioHistory(id, latestTimestamp, stats, years) {
                return historyResource(`/assets/${id}/collateralization-ratio`, latestTimestamp, stats, years);
            }
            async collateralizationRatioYear(id, stats, year, months) {
                return yearResource(`/assets/${id}/collateralization-ratio`, stats, year, months);
            }
            async collateralizationRatioMonth(id, stats, year, month, days) {
                return monthResource(`/assets/${id}/collateralization-ratio`, stats, year, month, days);
            }
            async collateralizationRatioDay(id, stats, year, month, day, hours) {
                return dayResource(`/assets/${id}/collateralization-ratio`, stats, year, month, day, hours);
            }
            async collateralizationRatioHour(id, stats) {
                if (!stats?.min || !stats.max || !stats.median)
                    return;
                return {
                    ...hourBaseResource(`/assets/${id}/collateralization-ratio`, stats.median.timestamp),
                    collateral: {
                        $ref: (0, time_1.setDateParts)(`/assets/${id}/underlying-assets/{year}/{month}/{day}/{hour}`, stats.median.collateral.timestamp),
                    },
                    marketCap: {
                        $ref: (0, time_1.setDateParts)(`/assets/${id}/market-cap/{year}/{month}/{day}/{hour}`, stats.median.market_cap.timestamp),
                    },
                    ratio: stats.median.ratio,
                };
            }
        },
        (() => {
            _index_decorators = [resources_1.JsonResources.register({
                    path: "/assets",
                    summary: "Retrieve a list of assets",
                    description: "Get a list of asset IDs and references",
                    type: "Assets",
                    // TODO write schema
                    schema: {},
                })];
            _collateralizationGraphHistory_decorators = [resources_1.JsonResources.register({
                    path: "/assets/collateralization-graph",
                    summary: "Get collateralization graph",
                    description: "Get the global collateralization graph of all assets",
                    type: "CollateralizationGraph",
                    // TODO write schema
                    schema: {},
                })];
            _collateralizationGraphYear_decorators = [resources_1.JsonResources.register({
                    path: "/assets/collateralization-graph/{year}",
                    summary: "Get collateralization graph for a specific year",
                    description: "Get the collateralization graph of all assets for a specific year",
                    type: "CollateralizationGraph",
                    // TODO write schema
                    schema: {},
                })];
            _collateralizationGraphMonth_decorators = [resources_1.JsonResources.register({
                    path: "/assets/collateralization-graph/{year}/{month}",
                    summary: "Get collateralization graph for a specific month",
                    description: "Get the collateralization graph of all assets for a specific month",
                    type: "CollateralizationGraph",
                    // TODO write schema
                    schema: {},
                })];
            _collateralizationGraphDay_decorators = [resources_1.JsonResources.register({
                    path: "/assets/collateralization-graph/{year}/{month}/{day}",
                    summary: "Get collateralization graph for a specific day",
                    description: "Get the collateralization graph of all assets for a specific day",
                    type: "CollateralizationGraph",
                    // TODO write schema
                    schema: {},
                })];
            _collateralizationGraphHour_decorators = [resources_1.JsonResources.register({
                    path: "/assets/collateralization-graph/{year}/{month}/{day}/{hour}",
                    summary: "Get collateralization graph for a specific hour",
                    description: "Get the collateralization graph of all assets for a specific hour",
                    type: "CollateralizationGraph",
                    // TODO write schema
                    schema: {},
                })];
            _asset_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}",
                    summary: "Get an asset",
                    description: "Get an asset by its ID",
                    type: "Asset",
                    // TODO write schema
                    schema: {},
                })];
            _details_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/details",
                    summary: "Get details of an asset",
                    description: "Get details of an asset by its ID",
                    type: "AssetDetails",
                    // TODO write schema
                    schema: {},
                })];
            _icons_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/icons",
                    summary: "Get icons of an asset",
                    description: "Get icons of an asset by its ID",
                    type: "AssetIcons",
                    // TODO write schema
                    schema: {},
                })];
            _priceHistory_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/price",
                    summary: "Get price of an asset",
                    description: "Get price of an asset by its ID",
                    type: "AssetPrice",
                    // TODO write schema
                    schema: {},
                })];
            _priceYear_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/price/{year}",
                    summary: "Get price of an asset",
                    description: "Get price of an asset by its ID",
                    type: "AssetPrice",
                    // TODO write schema
                    schema: {},
                })];
            _priceMonth_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/price/{year}/{month}",
                    summary: "Get price of an asset",
                    description: "Get price of an asset by its ID",
                    type: "AssetPrice",
                    // TODO write schema
                    schema: {},
                })];
            _priceDay_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/price/{year}/{month}/{day}",
                    summary: "Get price of an asset",
                    description: "Get price of an asset by its ID",
                    type: "AssetPrice",
                    // TODO write schema
                    schema: {},
                })];
            _priceHour_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/price/{year}/{month}/{day}/{hour}",
                    summary: "Get price of an asset",
                    description: "Get price of an asset by its ID",
                    type: "AssetPrice",
                    // TODO write schema
                    schema: {},
                })];
            _supplyHistory_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/supply",
                    summary: "Get supply of an asset",
                    description: "Get supply of an asset by its ID",
                    type: "AssetSupply",
                    // TODO write schema
                    schema: {},
                })];
            _supplyYear_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/supply/{year}",
                    summary: "Get supply of an asset",
                    description: "Get supply of an asset by its ID",
                    type: "AssetSupply",
                    // TODO write schema
                    schema: {},
                })];
            _supplyMonth_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/supply/{year}/{month}",
                    summary: "Get supply of an asset",
                    description: "Get supply of an asset by its ID",
                    type: "AssetSupply",
                    // TODO write schema
                    schema: {},
                })];
            _supplyDay_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/supply/{year}/{month}/{day}",
                    summary: "Get supply of an asset",
                    description: "Get supply of an asset by its ID",
                    type: "AssetSupply",
                    // TODO write schema
                    schema: {},
                })];
            _supplyHour_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/supply/{year}/{month}/{day}/{hour}",
                    summary: "Get supply of an asset",
                    description: "Get supply of an asset by its ID",
                    type: "AssetSupply",
                    // TODO write schema
                    schema: {},
                })];
            _marketCapHistory_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/market-cap",
                    summary: "Get market cap of an asset",
                    description: "Get market cap of an asset by its ID",
                    type: "AssetMarketCap",
                    // TODO write schema
                    schema: {},
                })];
            _marketCapYear_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/market-cap/{year}",
                    summary: "Get market cap of an asset",
                    description: "Get market cap of an asset by its ID",
                    type: "AssetMarketCap",
                    // TODO write schema
                    schema: {},
                })];
            _marketCapMonth_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/market-cap/{year}/{month}",
                    summary: "Get market cap of an asset",
                    description: "Get market cap of an asset by its ID",
                    type: "AssetMarketCap",
                    // TODO write schema
                    schema: {},
                })];
            _marketCapDay_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/market-cap/{year}/{month}/{day}",
                    summary: "Get market cap of an asset",
                    description: "Get market cap of an asset by its ID",
                    type: "AssetMarketCap",
                    // TODO write schema
                    schema: {},
                })];
            _marketCapHour_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/market-cap/{year}/{month}/{day}/{hour}",
                    summary: "Get market cap of an asset",
                    description: "Get market cap of an asset by its ID",
                    type: "AssetMarketCap",
                    // TODO write schema
                    schema: {},
                })];
            _underlyingAssetsHistory_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/underlying-assets",
                    summary: "Get underlying assets of an asset",
                    description: "Get underlying assets of an asset by its ID",
                    type: "AssetUnderlyingAssets",
                    // TODO write schema
                    schema: {},
                })];
            _underlyingAssetsYear_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/underlying-assets/{year}",
                    summary: "Get underlying assets of an asset",
                    description: "Get underlying assets of an asset by its ID",
                    type: "AssetUnderlyingAssets",
                    // TODO write schema
                    schema: {},
                })];
            _underlyingAssetsMonth_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/underlying-assets/{year}/{month}",
                    summary: "Get underlying assets of an asset",
                    description: "Get underlying assets of an asset by its ID",
                    type: "AssetUnderlyingAssets",
                    // TODO write schema
                    schema: {},
                })];
            _underlyingAssetsDay_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/underlying-assets/{year}/{month}/{day}",
                    summary: "Get underlying assets of an asset",
                    description: "Get underlying assets of an asset by its ID",
                    type: "AssetUnderlyingAssets",
                    // TODO write schema
                    schema: {},
                })];
            _underlyingAssetsHour_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/underlying-assets/{year}/{month}/{day}/{hour}",
                    summary: "Get underlying assets of an asset",
                    description: "Get underlying assets of an asset by its ID",
                    type: "AssetUnderlyingAssets",
                    // TODO write schema
                    schema: {},
                })];
            _collateralizationRatioHistory_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/collateralization-ratio",
                    summary: "Get collateralization ratio of an asset",
                    description: "Get collateralization ratio of an asset by its ID",
                    type: "AssetCollateralizationRatio",
                    // TODO write schema
                    schema: {},
                })];
            _collateralizationRatioYear_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/collateralization-ratio/{year}",
                    summary: "Get collateralization ratio of an asset",
                    description: "Get collateralization ratio of an asset by its ID",
                    type: "AssetCollateralizationRatio",
                    // TODO write schema
                    schema: {},
                })];
            _collateralizationRatioMonth_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/collateralization-ratio/{year}/{month}",
                    summary: "Get collateralization ratio of an asset",
                    description: "Get collateralization ratio of an asset by its ID",
                    type: "AssetCollateralizationRatio",
                    // TODO write schema
                    schema: {},
                })];
            _collateralizationRatioDay_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/collateralization-ratio/{year}/{month}/{day}",
                    summary: "Get collateralization ratio of an asset",
                    description: "Get collateralization ratio of an asset by its ID",
                    type: "AssetCollateralizationRatio",
                    // TODO write schema
                    schema: {},
                })];
            _collateralizationRatioHour_decorators = [resources_1.JsonResources.register({
                    path: "/assets/{id}/collateralization-ratio/{year}/{month}/{day}/{hour}",
                    summary: "Get collateralization ratio of an asset",
                    description: "Get collateralization ratio of an asset by its ID",
                    type: "AssetCollateralizationRatio",
                    // TODO write schema
                    schema: {},
                })];
            __esDecorate(_a, null, _index_decorators, { kind: "method", name: "index", static: false, private: false, access: { has: obj => "index" in obj, get: obj => obj.index } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _collateralizationGraphHistory_decorators, { kind: "method", name: "collateralizationGraphHistory", static: false, private: false, access: { has: obj => "collateralizationGraphHistory" in obj, get: obj => obj.collateralizationGraphHistory } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _collateralizationGraphYear_decorators, { kind: "method", name: "collateralizationGraphYear", static: false, private: false, access: { has: obj => "collateralizationGraphYear" in obj, get: obj => obj.collateralizationGraphYear } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _collateralizationGraphMonth_decorators, { kind: "method", name: "collateralizationGraphMonth", static: false, private: false, access: { has: obj => "collateralizationGraphMonth" in obj, get: obj => obj.collateralizationGraphMonth } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _collateralizationGraphDay_decorators, { kind: "method", name: "collateralizationGraphDay", static: false, private: false, access: { has: obj => "collateralizationGraphDay" in obj, get: obj => obj.collateralizationGraphDay } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _collateralizationGraphHour_decorators, { kind: "method", name: "collateralizationGraphHour", static: false, private: false, access: { has: obj => "collateralizationGraphHour" in obj, get: obj => obj.collateralizationGraphHour } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _asset_decorators, { kind: "method", name: "asset", static: false, private: false, access: { has: obj => "asset" in obj, get: obj => obj.asset } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _details_decorators, { kind: "method", name: "details", static: false, private: false, access: { has: obj => "details" in obj, get: obj => obj.details } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _icons_decorators, { kind: "method", name: "icons", static: false, private: false, access: { has: obj => "icons" in obj, get: obj => obj.icons } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _priceHistory_decorators, { kind: "method", name: "priceHistory", static: false, private: false, access: { has: obj => "priceHistory" in obj, get: obj => obj.priceHistory } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _priceYear_decorators, { kind: "method", name: "priceYear", static: false, private: false, access: { has: obj => "priceYear" in obj, get: obj => obj.priceYear } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _priceMonth_decorators, { kind: "method", name: "priceMonth", static: false, private: false, access: { has: obj => "priceMonth" in obj, get: obj => obj.priceMonth } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _priceDay_decorators, { kind: "method", name: "priceDay", static: false, private: false, access: { has: obj => "priceDay" in obj, get: obj => obj.priceDay } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _priceHour_decorators, { kind: "method", name: "priceHour", static: false, private: false, access: { has: obj => "priceHour" in obj, get: obj => obj.priceHour } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _supplyHistory_decorators, { kind: "method", name: "supplyHistory", static: false, private: false, access: { has: obj => "supplyHistory" in obj, get: obj => obj.supplyHistory } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _supplyYear_decorators, { kind: "method", name: "supplyYear", static: false, private: false, access: { has: obj => "supplyYear" in obj, get: obj => obj.supplyYear } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _supplyMonth_decorators, { kind: "method", name: "supplyMonth", static: false, private: false, access: { has: obj => "supplyMonth" in obj, get: obj => obj.supplyMonth } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _supplyDay_decorators, { kind: "method", name: "supplyDay", static: false, private: false, access: { has: obj => "supplyDay" in obj, get: obj => obj.supplyDay } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _supplyHour_decorators, { kind: "method", name: "supplyHour", static: false, private: false, access: { has: obj => "supplyHour" in obj, get: obj => obj.supplyHour } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _marketCapHistory_decorators, { kind: "method", name: "marketCapHistory", static: false, private: false, access: { has: obj => "marketCapHistory" in obj, get: obj => obj.marketCapHistory } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _marketCapYear_decorators, { kind: "method", name: "marketCapYear", static: false, private: false, access: { has: obj => "marketCapYear" in obj, get: obj => obj.marketCapYear } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _marketCapMonth_decorators, { kind: "method", name: "marketCapMonth", static: false, private: false, access: { has: obj => "marketCapMonth" in obj, get: obj => obj.marketCapMonth } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _marketCapDay_decorators, { kind: "method", name: "marketCapDay", static: false, private: false, access: { has: obj => "marketCapDay" in obj, get: obj => obj.marketCapDay } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _marketCapHour_decorators, { kind: "method", name: "marketCapHour", static: false, private: false, access: { has: obj => "marketCapHour" in obj, get: obj => obj.marketCapHour } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _underlyingAssetsHistory_decorators, { kind: "method", name: "underlyingAssetsHistory", static: false, private: false, access: { has: obj => "underlyingAssetsHistory" in obj, get: obj => obj.underlyingAssetsHistory } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _underlyingAssetsYear_decorators, { kind: "method", name: "underlyingAssetsYear", static: false, private: false, access: { has: obj => "underlyingAssetsYear" in obj, get: obj => obj.underlyingAssetsYear } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _underlyingAssetsMonth_decorators, { kind: "method", name: "underlyingAssetsMonth", static: false, private: false, access: { has: obj => "underlyingAssetsMonth" in obj, get: obj => obj.underlyingAssetsMonth } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _underlyingAssetsDay_decorators, { kind: "method", name: "underlyingAssetsDay", static: false, private: false, access: { has: obj => "underlyingAssetsDay" in obj, get: obj => obj.underlyingAssetsDay } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _underlyingAssetsHour_decorators, { kind: "method", name: "underlyingAssetsHour", static: false, private: false, access: { has: obj => "underlyingAssetsHour" in obj, get: obj => obj.underlyingAssetsHour } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _collateralizationRatioHistory_decorators, { kind: "method", name: "collateralizationRatioHistory", static: false, private: false, access: { has: obj => "collateralizationRatioHistory" in obj, get: obj => obj.collateralizationRatioHistory } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _collateralizationRatioYear_decorators, { kind: "method", name: "collateralizationRatioYear", static: false, private: false, access: { has: obj => "collateralizationRatioYear" in obj, get: obj => obj.collateralizationRatioYear } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _collateralizationRatioMonth_decorators, { kind: "method", name: "collateralizationRatioMonth", static: false, private: false, access: { has: obj => "collateralizationRatioMonth" in obj, get: obj => obj.collateralizationRatioMonth } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _collateralizationRatioDay_decorators, { kind: "method", name: "collateralizationRatioDay", static: false, private: false, access: { has: obj => "collateralizationRatioDay" in obj, get: obj => obj.collateralizationRatioDay } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _collateralizationRatioHour_decorators, { kind: "method", name: "collateralizationRatioHour", static: false, private: false, access: { has: obj => "collateralizationRatioHour" in obj, get: obj => obj.collateralizationRatioHour } }, null, _instanceExtraInitializers);
        })(),
        _a;
})();
exports.ASSET_RESOURCES = new Asset();
//# sourceMappingURL=assets.js.map