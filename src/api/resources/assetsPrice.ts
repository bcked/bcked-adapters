import _ from "lodash";
import path from "node:path";
import { fromAsync } from "../../utils/array";
import {
    readCSV,
    readCSVForDates,
    readCSVWithMeta,
    readClosestEntry,
    readLastEntry,
} from "../../utils/csv";
import { statsBy } from "../../utils/math";
import { getDateParts, partsToDate, setDateParts } from "../../utils/time";
import { JsonResources } from "../utils/resources";

const ASSETS_PATH = "assets";
const RECORDS = "records";

export const RESOURCES = new JsonResources({
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
RESOURCES.register({
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

RESOURCES.register({
    path: "/assets/{id}/price/latest",
    summary: "Get price of an asset",
    description: "Get price of an asset by its ID",
    type: "AssetPriceLatest",
    // TODO write schema
    schema: {},
    loader: async ({ id }) => {
        const filePath = path.join(ASSETS_PATH, id, RECORDS, "price.csv");

        const latests = await readLastEntry<bcked.asset.Price>(filePath);

        const { year, month, day, hour } = getDateParts(latests.timestamp);

        const resource = {
            $id: `/assets/${id}/price/latest`,
            $ref: `/assets/${id}/price/${year}/${month}/${day}/${hour}`,
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/price/all-time",
    summary: "Get price of an asset",
    description: "Get price of an asset by its ID",
    type: "AssetPriceSummary",
    // TODO write schema
    schema: {},
    populateCache: async function* ({ id }) {
        while (true) {
            const { row, index, total } = yield;

            console.log(row);

            const { year, month, day, hour } = getDateParts(row.timestamp);

            // TODO call other populateCache functions
            `/assets/${id}/price/${year}/${month}/${day}/${hour}`;

            // Reached the end of the file
            if (index === total - 1) break;
        }

        // TODO store to cache
    },
    loader: async ({ id, populateCache }) => {
        // TODO still needed?

        const filePath = path.join(ASSETS_PATH, id, RECORDS, "price.csv");

        // const { populateCache } = RESOURCES.matchLoader(`/assets/{id}/price/all-time`);

        // const priceCache = populateCache(id);

        for await (const entry of readCSVWithMeta<bcked.asset.Price>(filePath)) {
            populateCache.next(entry);
            console.log(entry);
        }

        const entries = await fromAsync(readCSV<bcked.asset.Price>(filePath));

        const stats = statsBy(entries, "usd")!;

        const years = _.uniq(entries.map((entry) => getDateParts(entry.timestamp).year!));

        const resource = {
            $id: `/assets/${id}/price/all-time`,
            high: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.high.timestamp
                ),
            },
            median: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.median.timestamp
                ),
            },
            low: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.low.timestamp
                ),
            },
            data: years.map((year) => ({
                $ref: `/assets/${id}/price/${year}`,
            })),
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/price/{year}",
    summary: "Get price of an asset",
    description: "Get price of an asset by its ID",
    type: "AssetPriceSummary",
    // TODO write schema
    schema: {},
    loader: async ({ id, year }) => {
        const filePath = path.join(ASSETS_PATH, id, RECORDS, "price.csv");

        const entries = await fromAsync(readCSVForDates<bcked.asset.Price>(filePath, { year }));

        const stats = statsBy(entries, "usd")!;

        const months = _.uniq(entries.map((entry) => getDateParts(entry.timestamp).month!));

        const resource = {
            $id: `/assets/${id}/price/${year}`,
            high: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.high.timestamp
                ),
            },
            median: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.median.timestamp
                ),
            },
            low: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.low.timestamp
                ),
            },
            data: months.map((month) => ({
                $ref: `/assets/${id}/price/${year}/${month}`,
            })),
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/price/{year}/{month}",
    summary: "Get price of an asset",
    description: "Get price of an asset by its ID",
    type: "AssetPriceSummary",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month }) => {
        const filePath = path.join(ASSETS_PATH, id, RECORDS, "price.csv");

        const entries = await fromAsync(
            readCSVForDates<bcked.asset.Price>(filePath, { year, month })
        );

        const stats = statsBy(entries, "usd")!;

        const days = _.uniq(entries.map((entry) => getDateParts(entry.timestamp).day!));

        const resource = {
            $id: `/assets/${id}/price/${year}/${month}`,
            high: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.high.timestamp
                ),
            },
            median: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.median.timestamp
                ),
            },
            low: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.low.timestamp
                ),
            },
            data: days.map((day) => ({
                $ref: `/assets/${id}/price/${year}/${month}/${day}`,
            })),
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/price/{year}/{month}/{day}",
    summary: "Get price of an asset",
    description: "Get price of an asset by its ID",
    type: "AssetPriceSummary",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month, day }) => {
        const filePath = path.join(ASSETS_PATH, id, RECORDS, "price.csv");

        const entries = await fromAsync(
            readCSVForDates<bcked.asset.Price>(filePath, { year, month, day })
        );

        const stats = statsBy(entries, "usd")!;

        const hours = _.uniq(entries.map((entry) => getDateParts(entry.timestamp).hour!));

        const resource = {
            $id: `/assets/${id}/price/${year}/${month}/${day}`,
            high: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.high.timestamp
                ),
            },
            median: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.median.timestamp
                ),
            },
            low: {
                $ref: setDateParts(
                    `/assets/${id}/price/{year}/{month}/{day}/{hour}`,
                    stats.low.timestamp
                ),
            },
            data: hours.map((hour) => ({
                $ref: `/assets/${id}/price/${year}/${month}/${day}/${hour}`,
            })),
        };

        return resource;
    },
});

RESOURCES.register({
    path: "/assets/{id}/price/{year}/{month}/{day}/{hour}",
    summary: "Get price of an asset",
    description: "Get price of an asset by its ID",
    type: "AssetPriceRecord",
    // TODO write schema
    schema: {},
    loader: async ({ id, year, month, day, hour }) => {
        const filePath = path.join(ASSETS_PATH, id, RECORDS, "price.csv");

        // TODO this potentially matches "non close" entries if there are no close ones
        const entry = await readClosestEntry<bcked.asset.Price>(
            filePath,
            partsToDate({ year, month, day, hour })
        );

        const resource = {
            $id: `/assets/${id}/price/${year}/${month}/${day}/${hour}`,
            timestamp: entry!.timestamp,
            value: {
                "rwa:USD": entry!.usd,
            },
        };

        return resource;
    },
});
