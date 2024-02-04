"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetAdapterProxy = exports.EntityAdapterProxy = exports.SystemAdapterProxy = exports.isNewEntry = exports.AdapterCache = exports.getAdapter = void 0;
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const array_1 = require("../../utils/array");
const cache_1 = require("../../utils/cache");
const csv_1 = require("../../utils/csv");
const files_1 = require("../../utils/files");
const helper_1 = require("../../utils/helper");
const string_formatting_1 = require("../../utils/string_formatting");
const time_1 = require("../../utils/time");
const ts_worker_1 = require("../../utils/ts_worker");
async function getAdapter(pathToFile) {
    const adapterPath = path_1.default.resolve((0, ts_worker_1.adaptFileExt)(pathToFile));
    const { default: Adapter } = await Promise.resolve(`${adapterPath}`).then(s => __importStar(require(s)));
    return new Adapter();
}
exports.getAdapter = getAdapter;
class AdapterCache {
    constructor() {
        this.adapters = {};
    }
    async getAdapterInstance(kind, id) {
        const key = `${kind}/${id}`;
        if (key in this.adapters)
            return this.adapters[key];
        this.adapters[key] = await getAdapter(`${kind}/${id}/index.ts`);
        return this.adapters[key];
    }
}
exports.AdapterCache = AdapterCache;
function isNewEntry(cached, entry, threshold) {
    const isNewEntryWithoutCache = cached == null && entry != null;
    const isNewerEntryThanCached = cached != null && entry != null && (0, time_1.isNewer)(cached.timestamp, entry.timestamp, threshold);
    // Only submit new entry if values changed?
    // || !_.isEqual(_.omit(cached, "timestamp"), _.omit(entry, "timestamp"))
    return isNewEntryWithoutCache || isNewerEntryThanCached;
}
exports.isNewEntry = isNewEntry;
class SystemAdapterProxy extends AdapterCache {
    async getDetails(id) {
        const pathToFile = `systems/${id}/records/details.json`;
        const lastRecorded = await (0, files_1.readJson)(pathToFile);
        if (lastRecorded && !(0, time_1.isNewer)(lastRecorded.updated, Date.now(), (0, time_1.minInMs)(10)))
            return lastRecorded;
        const adapter = await this.getAdapterInstance("systems", id);
        const details = await adapter.getDetails(lastRecorded);
        if (lastRecorded && lodash_1.default.isEqual(lodash_1.default.omit(lastRecorded, ["listed", "updated"]), details))
            return lastRecorded;
        const detailsRecord = {
            ...details,
            listed: lastRecorded ? lastRecorded.listed : (0, string_formatting_1.toISOString)(Date.now()),
            updated: (0, string_formatting_1.toISOString)(Date.now()),
        };
        await (0, files_1.writeJson)(pathToFile, detailsRecord);
        return detailsRecord;
    }
    async update(id) {
        const adapter = await this.getAdapterInstance("systems", id);
        await adapter.update();
    }
}
exports.SystemAdapterProxy = SystemAdapterProxy;
class EntityAdapterProxy extends AdapterCache {
    async getDetails(id) {
        const pathToFile = `entities/${id}/records/details.json`;
        const lastRecorded = await (0, files_1.readJson)(pathToFile);
        if (lastRecorded && !(0, time_1.isNewer)(lastRecorded.updated, Date.now(), (0, time_1.minInMs)(10)))
            return lastRecorded;
        const adapter = await this.getAdapterInstance("entities", id);
        const details = await adapter.getDetails(lastRecorded);
        if (lastRecorded && lodash_1.default.isEqual(lodash_1.default.omit(lastRecorded, ["listed", "updated"]), details))
            return lastRecorded;
        const detailsRecord = {
            ...details,
            listed: lastRecorded ? lastRecorded.listed : (0, string_formatting_1.toISOString)(Date.now()),
            updated: (0, string_formatting_1.toISOString)(Date.now()),
        };
        await (0, files_1.writeJson)(pathToFile, detailsRecord);
        return detailsRecord;
    }
    async update(id) {
        const adapter = await this.getAdapterInstance("entities", id);
        await adapter.update();
    }
}
exports.EntityAdapterProxy = EntityAdapterProxy;
class AssetAdapterProxy extends AdapterCache {
    async getDetails(identifier) {
        const assetId = (0, helper_1.toId)(identifier);
        const pathToFile = `assets/${assetId}/records/details.json`;
        const lastRecorded = await (0, files_1.readJson)(pathToFile);
        if (lastRecorded && !(0, time_1.isNewer)(lastRecorded.updated, Date.now(), (0, time_1.minInMs)(10)))
            return lastRecorded;
        const adapter = await this.getAdapterInstance("assets", assetId);
        const details = await adapter.getDetails(lastRecorded);
        if (lastRecorded && lodash_1.default.isEqual(lodash_1.default.omit(lastRecorded, ["listed", "updated"]), details))
            return lastRecorded;
        const detailsRecord = {
            ...details,
            listed: lastRecorded ? lastRecorded.listed : (0, string_formatting_1.toISOString)(Date.now()),
            updated: (0, string_formatting_1.toISOString)(Date.now()),
        };
        await (0, files_1.writeJson)(pathToFile, detailsRecord);
        return detailsRecord;
    }
    async getPrice(identifier) {
        const assetId = (0, helper_1.toId)(identifier);
        const csvPath = `assets/${assetId}/records/price.csv`;
        const lastRecorded = await (0, cache_1.getLatest)(csvPath);
        if (lastRecorded && !(0, time_1.isNewer)(lastRecorded.timestamp, Date.now(), (0, time_1.minInMs)(10)))
            return [lastRecorded];
        const adapter = await this.getAdapterInstance("assets", assetId);
        const price = await adapter.getPrice(lastRecorded);
        const entries = lodash_1.default.sortBy(price, "timestamp").filter((entry) => isNewEntry(lastRecorded, entry, (0, time_1.minInMs)(10)));
        await (0, csv_1.writeToCsv)(csvPath, (0, array_1.toAsync)(entries), "timestamp");
        return entries;
    }
    async getSupply(identifier) {
        const assetId = (0, helper_1.toId)(identifier);
        const csvPath = `assets/${assetId}/records/supply.csv`;
        const lastRecorded = await (0, cache_1.getLatest)(csvPath);
        if (lastRecorded && !(0, time_1.isNewer)(lastRecorded.timestamp, Date.now(), (0, time_1.minInMs)(10)))
            return [lastRecorded];
        const adapter = await this.getAdapterInstance("assets", assetId);
        const supply = await adapter.getSupply(lastRecorded);
        const entries = lodash_1.default.sortBy(supply, "timestamp").filter((entry) => isNewEntry(lastRecorded, entry, (0, time_1.minInMs)(10)));
        await (0, csv_1.writeToCsv)(csvPath, (0, array_1.toAsync)(entries), "timestamp");
        return entries;
    }
    async getBacking(identifier) {
        const assetId = (0, helper_1.toId)(identifier);
        const csvPath = `assets/${assetId}/records/backing.csv`;
        const lastRecorded = await (0, cache_1.getLatest)(csvPath);
        if (lastRecorded && !(0, time_1.isNewer)(lastRecorded.timestamp, Date.now(), (0, time_1.minInMs)(10)))
            return [lastRecorded];
        const adapter = await this.getAdapterInstance("assets", assetId);
        const backing = await adapter.getBacking(lastRecorded);
        const entries = lodash_1.default.sortBy(backing, "timestamp").filter((entry) => isNewEntry(lastRecorded, entry, (0, time_1.minInMs)(10)));
        await (0, csv_1.writeToCsv)(csvPath, (0, array_1.toAsync)(entries), "timestamp");
        return entries;
    }
}
exports.AssetAdapterProxy = AssetAdapterProxy;
//# sourceMappingURL=proxy.js.map