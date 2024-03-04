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
exports.SYSTEM_RESOURCES = void 0;
const time_1 = require("../../utils/time");
const icons_1 = require("../utils/icons");
const resources_1 = require("../utils/resources");
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
function hourBaseResource(path, timestamp) {
    return {
        $id: (0, time_1.setDateParts)(`${path}/{year}/{month}/{day}/{hour}`, timestamp),
        timestamp,
    };
}
let System = (() => {
    var _a;
    let _instanceExtraInitializers = [];
    let _index_decorators;
    let _system_decorators;
    let _details_decorators;
    let _icons_decorators;
    let _assets_decorators;
    let _totalValueLockedHistory_decorators;
    let _totalValueLockedYear_decorators;
    let _totalValueLockedMonth_decorators;
    let _totalValueLockedDay_decorators;
    let _totalValueLockedHour_decorators;
    return _a = class System extends resources_1.JsonResources {
            constructor() {
                super({
                    name: "Systems",
                    description: "Everything about systems",
                    externalDocs: {
                        description: "View on bcked.com",
                        url: "https://bcked.com/systems",
                    },
                });
                __runInitializers(this, _instanceExtraInitializers);
            }
            async index(ids) {
                return {
                    $id: "/systems",
                    systems: ids.map((id) => ({
                        $ref: `/systems/${id}`,
                    })),
                };
            }
            async system(id) {
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
            async details(id, details) {
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
            async icons(id) {
                return (0, icons_1.icons)("systems", id);
            }
            async assets(id, assetIds) {
                return {
                    $id: `/systems/${id}/assets`,
                    assets: assetIds.map((assetId) => ({
                        $ref: `/assets/${assetId}`,
                    })),
                };
            }
            async totalValueLockedHistory(id, latestTimestamp, stats, years) {
                return historyResource(`/systems/${id}/total-value-locked`, latestTimestamp, stats, years);
            }
            async totalValueLockedYear(id, stats, year, months) {
                return yearResource(`/systems/${id}/total-value-locked`, stats, year, months);
            }
            async totalValueLockedMonth(id, stats, year, month, days) {
                return monthResource(`/systems/${id}/total-value-locked`, stats, year, month, days);
            }
            async totalValueLockedDay(id, stats, year, month, day, hours) {
                return dayResource(`/systems/${id}/total-value-locked`, stats, year, month, day, hours);
            }
            async totalValueLockedHour(id, stats) {
                if (!stats?.min || !stats.max || !stats.median)
                    return;
                return {
                    ...hourBaseResource(`/systems/${id}/total-value-locked`, stats.median.timestamp),
                    value: {
                        "rwa:USD": stats.median.totalValueLocked,
                    },
                };
            }
        },
        (() => {
            _index_decorators = [resources_1.JsonResources.register({
                    path: "/systems",
                    summary: "Retrieve a list of systems",
                    description: "Get a list of system IDs and references",
                    type: "Systems",
                    // TODO write schema
                    schema: {},
                })];
            _system_decorators = [resources_1.JsonResources.register({
                    path: "/systems/{id}",
                    summary: "Get a system",
                    description: "Get an system by its ID",
                    type: "System",
                    // TODO write schema
                    schema: {},
                })];
            _details_decorators = [resources_1.JsonResources.register({
                    path: "/systems/{id}/details",
                    summary: "Get details of a system",
                    description: "Get details of a system by its ID",
                    type: "SystemDetails",
                    // TODO write schema
                    schema: {},
                })];
            _icons_decorators = [resources_1.JsonResources.register({
                    path: "/systems/{id}/icons",
                    summary: "Get icons of a system",
                    description: "Get icons of a system by its ID",
                    type: "SystemIcons",
                    // TODO write schema
                    schema: {},
                })];
            _assets_decorators = [resources_1.JsonResources.register({
                    path: "/systems/{id}/assets",
                    summary: "Get assets of a system",
                    description: "Get assets of a system by its ID",
                    type: "SystemAssets",
                    // TODO write schema
                    schema: {},
                })];
            _totalValueLockedHistory_decorators = [resources_1.JsonResources.register({
                    path: "/systems/{id}/total-value-locked",
                    summary: "Get total value locked of an asset",
                    description: "Get total value locked of an asset by its ID",
                    type: "SystemTotalValueLocked",
                    // TODO write schema
                    schema: {},
                })];
            _totalValueLockedYear_decorators = [resources_1.JsonResources.register({
                    path: "/systems/{id}/total-value-locked/{year}",
                    summary: "Get total value locked of an asset",
                    description: "Get total value locked of an asset by its ID",
                    type: "SystemTotalValueLocked",
                    // TODO write schema
                    schema: {},
                })];
            _totalValueLockedMonth_decorators = [resources_1.JsonResources.register({
                    path: "/systems/{id}/total-value-locked/{year}/{month}",
                    summary: "Get total value locked of an asset",
                    description: "Get total value locked of an asset by its ID",
                    type: "SystemTotalValueLocked",
                    // TODO write schema
                    schema: {},
                })];
            _totalValueLockedDay_decorators = [resources_1.JsonResources.register({
                    path: "/systems/{id}/total-value-locked/{year}/{month}/{day}",
                    summary: "Get total value locked of an asset",
                    description: "Get total value locked of an asset by its ID",
                    type: "SystemTotalValueLocked",
                    // TODO write schema
                    schema: {},
                })];
            _totalValueLockedHour_decorators = [resources_1.JsonResources.register({
                    path: "/systems/{id}/total-value-locked/{year}/{month}/{day}/{hour}",
                    summary: "Get total value locked of an asset",
                    description: "Get total value locked of an asset by its ID",
                    type: "SystemTotalValueLocked",
                    // TODO write schema
                    schema: {},
                })];
            __esDecorate(_a, null, _index_decorators, { kind: "method", name: "index", static: false, private: false, access: { has: obj => "index" in obj, get: obj => obj.index } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _system_decorators, { kind: "method", name: "system", static: false, private: false, access: { has: obj => "system" in obj, get: obj => obj.system } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _details_decorators, { kind: "method", name: "details", static: false, private: false, access: { has: obj => "details" in obj, get: obj => obj.details } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _icons_decorators, { kind: "method", name: "icons", static: false, private: false, access: { has: obj => "icons" in obj, get: obj => obj.icons } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _assets_decorators, { kind: "method", name: "assets", static: false, private: false, access: { has: obj => "assets" in obj, get: obj => obj.assets } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _totalValueLockedHistory_decorators, { kind: "method", name: "totalValueLockedHistory", static: false, private: false, access: { has: obj => "totalValueLockedHistory" in obj, get: obj => obj.totalValueLockedHistory } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _totalValueLockedYear_decorators, { kind: "method", name: "totalValueLockedYear", static: false, private: false, access: { has: obj => "totalValueLockedYear" in obj, get: obj => obj.totalValueLockedYear } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _totalValueLockedMonth_decorators, { kind: "method", name: "totalValueLockedMonth", static: false, private: false, access: { has: obj => "totalValueLockedMonth" in obj, get: obj => obj.totalValueLockedMonth } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _totalValueLockedDay_decorators, { kind: "method", name: "totalValueLockedDay", static: false, private: false, access: { has: obj => "totalValueLockedDay" in obj, get: obj => obj.totalValueLockedDay } }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _totalValueLockedHour_decorators, { kind: "method", name: "totalValueLockedHour", static: false, private: false, access: { has: obj => "totalValueLockedHour" in obj, get: obj => obj.totalValueLockedHour } }, null, _instanceExtraInitializers);
        })(),
        _a;
})();
exports.SYSTEM_RESOURCES = new System();
//# sourceMappingURL=systems.js.map