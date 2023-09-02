"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESOURCES = void 0;
const lodash_1 = __importDefault(require("lodash"));
const node_path_1 = __importDefault(require("node:path"));
const array_1 = require("../../utils/array");
const csv_1 = require("../../utils/csv");
const math_1 = require("../../utils/math");
const time_1 = require("../../utils/time");
const resources_1 = require("../utils/resources");
const ASSETS_PATH = "assets";
const RECORDS = "records";
exports.RESOURCES = new resources_1.JsonResources({
    name: "Assets Price",
    description: "Everything about asset price",
    externalDocs: {
        description: "View on bcked.com",
        url: "https://bcked.com/assets",
    },
});
// parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The ID of the asset
exports.RESOURCES.register({
    path: "/assets/{id}/price",
    summary: "Get price of an asset",
    description: "Get price of an asset by its ID",
    type: "AssetPrice",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        const resource = {
            $id: `/assets/${id}/price`,
            latest: {
                $ref: `/assets/${id}/price/latest`,
            },
            allTime: {
                $ref: `/assets/${id}/price/all-time`,
            },
        };
        return resource;
    },
});
exports.RESOURCES.register({
    path: "/assets/{id}/price/latest",
    summary: "Get price of an asset",
    description: "Get price of an asset by its ID",
    type: "AssetPriceLatest",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        const filePath = node_path_1.default.join(ASSETS_PATH, id, RECORDS, "price.csv");
        const latests = await (0, csv_1.readLastEntry)(filePath);
        const { year, month, day, hour } = (0, time_1.getDateParts)(latests.timestamp);
        const resource = {
            $id: `/assets/${id}/price/latest`,
            $ref: `/assets/${id}/price/${year}/${month}/${day}/${hour}`,
        };
        return resource;
    },
});
exports.RESOURCES.register({
    path: "/assets/{id}/price/all-time",
    summary: "Get price of an asset",
    description: "Get price of an asset by its ID",
    type: "AssetPriceSummary",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        const filePath = node_path_1.default.join(ASSETS_PATH, id, RECORDS, "price.csv");
        const entries = await (0, array_1.fromAsync)((0, csv_1.readCSV)(filePath));
        const stats = (0, math_1.statsBy)(entries, "usd");
        const years = lodash_1.default.uniq(entries.map((entry) => (0, time_1.getDateParts)(entry.timestamp).year));
        const resource = {
            $id: `/assets/${id}/price/all-time`,
            high: {
                $ref: (0, time_1.setDateParts)(`/assets/${id}/price/{year}/{month}/{day}/{hour}`, stats.high.timestamp),
            },
            median: {
                $ref: (0, time_1.setDateParts)(`/assets/${id}/price/{year}/{month}/{day}/{hour}`, stats.median.timestamp),
            },
            low: {
                $ref: (0, time_1.setDateParts)(`/assets/${id}/price/{year}/{month}/{day}/{hour}`, stats.low.timestamp),
            },
            data: years.map((year) => ({
                $ref: `/assets/${id}/price/${year}`,
            })),
        };
        return resource;
    },
});
exports.RESOURCES.register({
    path: "/assets/{id}/price/{year}",
    summary: "Get price of an asset",
    description: "Get price of an asset by its ID",
    type: "AssetPriceSummary",
    // TODO write schema
    schema: {},
    loader: async ({ id, year }) => {
        const filePath = node_path_1.default.join(ASSETS_PATH, id, RECORDS, "price.csv");
        const entries = await (0, array_1.fromAsync)((0, csv_1.readCSVForDates)(filePath, { year }));
        const stats = (0, math_1.statsBy)(entries, "usd");
        const months = lodash_1.default.uniq(entries.map((entry) => (0, time_1.getDateParts)(entry.timestamp).month));
        const resource = {
            $id: `/assets/${id}/price/${year}`,
            high: {
                $ref: (0, time_1.setDateParts)(`/assets/${id}/price/{year}/{month}/{day}/{hour}`, stats.high.timestamp),
            },
            median: {
                $ref: (0, time_1.setDateParts)(`/assets/${id}/price/{year}/{month}/{day}/{hour}`, stats.median.timestamp),
            },
            low: {
                $ref: (0, time_1.setDateParts)(`/assets/${id}/price/{year}/{month}/{day}/{hour}`, stats.low.timestamp),
            },
            data: months.map((month) => ({
                $ref: `/assets/${id}/price/${year}/${month}`,
            })),
        };
        return resource;
    },
});
exports.RESOURCES.register({
    path: "/assets/{id}/price/{year}/{month}",
    summary: "Get price of an asset",
    description: "Get price of an asset by its ID",
    type: "AssetPriceSummary",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month }) => {
        const filePath = node_path_1.default.join(ASSETS_PATH, id, RECORDS, "price.csv");
        const entries = await (0, array_1.fromAsync)((0, csv_1.readCSVForDates)(filePath, { year, month }));
        const stats = (0, math_1.statsBy)(entries, "usd");
        const days = lodash_1.default.uniq(entries.map((entry) => (0, time_1.getDateParts)(entry.timestamp).day));
        const resource = {
            $id: `/assets/${id}/price/${year}/${month}`,
            high: {
                $ref: (0, time_1.setDateParts)(`/assets/${id}/price/{year}/{month}/{day}/{hour}`, stats.high.timestamp),
            },
            median: {
                $ref: (0, time_1.setDateParts)(`/assets/${id}/price/{year}/{month}/{day}/{hour}`, stats.median.timestamp),
            },
            low: {
                $ref: (0, time_1.setDateParts)(`/assets/${id}/price/{year}/{month}/{day}/{hour}`, stats.low.timestamp),
            },
            data: days.map((day) => ({
                $ref: `/assets/${id}/price/${year}/${month}/${day}`,
            })),
        };
        return resource;
    },
});
exports.RESOURCES.register({
    path: "/assets/{id}/price/{year}/{month}/{day}",
    summary: "Get price of an asset",
    description: "Get price of an asset by its ID",
    type: "AssetPriceSummary",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month, day }) => {
        const filePath = node_path_1.default.join(ASSETS_PATH, id, RECORDS, "price.csv");
        const entries = await (0, array_1.fromAsync)((0, csv_1.readCSVForDates)(filePath, { year, month, day }));
        const stats = (0, math_1.statsBy)(entries, "usd");
        const hours = lodash_1.default.uniq(entries.map((entry) => (0, time_1.getDateParts)(entry.timestamp).hour));
        const resource = {
            $id: `/assets/${id}/price/${year}/${month}/${day}`,
            high: {
                $ref: (0, time_1.setDateParts)(`/assets/${id}/price/{year}/{month}/{day}/{hour}`, stats.high.timestamp),
            },
            median: {
                $ref: (0, time_1.setDateParts)(`/assets/${id}/price/{year}/{month}/{day}/{hour}`, stats.median.timestamp),
            },
            low: {
                $ref: (0, time_1.setDateParts)(`/assets/${id}/price/{year}/{month}/{day}/{hour}`, stats.low.timestamp),
            },
            data: hours.map((hour) => ({
                $ref: `/assets/${id}/price/${year}/${month}/${day}/${hour}`,
            })),
        };
        return resource;
    },
});
exports.RESOURCES.register({
    path: "/assets/{id}/price/{year}/{month}/{day}/{hour}",
    summary: "Get price of an asset",
    description: "Get price of an asset by its ID",
    type: "AssetPriceRecord",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month, day, hour }) => {
        const filePath = node_path_1.default.join(ASSETS_PATH, id, RECORDS, "price.csv");
        // TODO this potentially matches "non close" entries if there are no close ones
        const entry = await (0, csv_1.readClosestEntry)(filePath, (0, time_1.partsToDate)({ year, month, day, hour }));
        const resource = {
            $id: `/assets/${id}/price/${year}/${month}/${day}/${hour}`,
            timestamp: entry.timestamp,
            value: {
                "rwa:USD": entry.usd,
            },
        };
        return resource;
    },
});
//# sourceMappingURL=assetsPrice.js.map