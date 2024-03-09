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
exports.GRAPH_RESOURCES = exports.Graph = void 0;
const time_1 = require("../../utils/time");
const openapi_1 = require("../utils/openapi");
const resources_1 = require("../utils/resources");
let Graph = exports.Graph = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _index_decorators;
    let _collateralizationGraphHistory_decorators;
    let _collateralizationGraphYear_decorators;
    let _collateralizationGraphMonth_decorators;
    let _collateralizationGraphDay_decorators;
    return _a = class Graph extends openapi_1.JsonResources {
            constructor() {
                super({
                    name: "Graphs",
                    description: "Everything about graphs",
                    externalDocs: {
                        description: "View on bcked.com",
                        url: "https://bcked.com/graph",
                    },
                });
                __runInitializers(this, _instanceExtraInitializers);
            }
            async index() {
                return {
                    $id: "/graphs",
                    collateralization: {
                        $ref: `/graphs/collateralization`,
                    },
                };
            }
            async collateralizationGraphHistory(latestTimestamp, stats, years) {
                return (0, resources_1.historyResource)("/graphs/collateralization", latestTimestamp, stats, years, "{year}/{month}/{day}");
            }
            async collateralizationGraphYear(stats, year, months) {
                return (0, resources_1.yearResource)("/graphs/collateralization", stats, year, months, "{year}/{month}/{day}");
            }
            async collateralizationGraphMonth(stats, year, month, days) {
                return (0, resources_1.monthResource)("/graphs/collateralization", stats, year, month, days, "{year}/{month}/{day}");
            }
            async collateralizationGraphDay(stats) {
                if (!stats?.min || !stats.max || !stats.median)
                    return;
                return {
                    $id: (0, time_1.setDateParts)(`/graphs/collateralization/{year}/{month}/{day}`, stats.median.timestamp),
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
        },
        (() => {
            _index_decorators = [openapi_1.JsonResources.register({
                    path: "/graphs",
                    summary: "Retrieve a list of endpoints to retrieve graphs",
                    description: "Get a list of asset IDs and references",
                    type: "Graphs",
                    // TODO write schema
                    schema: {},
                })];
            _collateralizationGraphHistory_decorators = [openapi_1.JsonResources.register({
                    path: "/graphs/collateralization",
                    summary: "Get collateralization graph",
                    description: "Get the global collateralization graph of all assets",
                    type: "CollateralizationGraph",
                    // TODO write schema
                    schema: {},
                })];
            _collateralizationGraphYear_decorators = [openapi_1.JsonResources.register({
                    path: "/graphs/collateralization/{year}",
                    summary: "Get collateralization graph for a specific year",
                    description: "Get the collateralization graph of all assets for a specific year",
                    type: "CollateralizationGraph",
                    // TODO write schema
                    schema: {},
                })];
            _collateralizationGraphMonth_decorators = [openapi_1.JsonResources.register({
                    path: "/graphs/collateralization/{year}/{month}",
                    summary: "Get collateralization graph for a specific month",
                    description: "Get the collateralization graph of all assets for a specific month",
                    type: "CollateralizationGraph",
                    // TODO write schema
                    schema: {},
                })];
            _collateralizationGraphDay_decorators = [openapi_1.JsonResources.register({
                    path: "/graphs/collateralization/{year}/{month}/{day}",
                    summary: "Get collateralization graph for a specific day",
                    description: "Get the collateralization graph of all assets for a specific day",
                    type: "CollateralizationGraph",
                    // TODO write schema
                    schema: {},
                })];
            __esDecorate(_a, null, _index_decorators, { kind: "method", name: "index", static: false, private: false, access: { has: obj => "index" in obj, get: obj => obj.index } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _collateralizationGraphHistory_decorators, { kind: "method", name: "collateralizationGraphHistory", static: false, private: false, access: { has: obj => "collateralizationGraphHistory" in obj, get: obj => obj.collateralizationGraphHistory } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _collateralizationGraphYear_decorators, { kind: "method", name: "collateralizationGraphYear", static: false, private: false, access: { has: obj => "collateralizationGraphYear" in obj, get: obj => obj.collateralizationGraphYear } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _collateralizationGraphMonth_decorators, { kind: "method", name: "collateralizationGraphMonth", static: false, private: false, access: { has: obj => "collateralizationGraphMonth" in obj, get: obj => obj.collateralizationGraphMonth } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _collateralizationGraphDay_decorators, { kind: "method", name: "collateralizationGraphDay", static: false, private: false, access: { has: obj => "collateralizationGraphDay" in obj, get: obj => obj.collateralizationGraphDay } }, null, _instanceExtraInitializers);
        })(),
        _a;
})();
exports.GRAPH_RESOURCES = new Graph();
//# sourceMappingURL=graphs.js.map