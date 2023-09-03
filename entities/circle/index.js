"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Circles reserves are two fold.
 *
 * 1. Reserve holdings managed by BlackRock, see: https://www.blackrock.com/cash/en-us/products/329365/
 * 2. Cash holdings by Circle, see: https://www.circle.com/en/transparency
 *
 * Note: Cash holdings are reported infrequently or via the attestation reports.
 */
const crawler_1 = __importDefault(require("crawler"));
const dateformat_1 = __importDefault(require("dateformat"));
const fs_1 = __importDefault(require("fs"));
const lodash_1 = __importDefault(require("lodash"));
const br_manager_1 = require("../../src/crawler/apis/br_manager");
const cache_1 = require("../../src/utils/cache");
const csv_1 = require("../../src/utils/csv");
const string_formatting_1 = require("../../src/utils/string_formatting");
const time_1 = require("../../src/utils/time");
const details = {
    name: "Circle",
    identifier: "circle",
    reference: "https://www.circle.com/",
    tags: [],
};
class Adapter {
    constructor() {
        this.treasuryManager = new br_manager_1.BRManager();
        this.crawler = new crawler_1.default({ rateLimit: 1000 });
        this.recordsPath = `entities/${details.identifier}/records`;
    }
    async getDetails() {
        return details;
    }
    async fetchLatestTreasuryReserves() {
        const csvPath = `${this.recordsPath}/reserves.csv`;
        const lastEntry = await (0, cache_1.getLatest)(csvPath);
        // Check if the latest records are of the same day. If yes, don't fetch, as there can be no newer data.
        if (lastEntry !== null && (0, time_1.isClose)(lastEntry.timestamp, Date.now(), (0, time_1.hoursInMs)(23.99)))
            return;
        const startOfRecordings = new Date("2022-11-02");
        const startDate = new Date(lastEntry?.timestamp ?? startOfRecordings);
        // Loop through the dates using timestamps and create Date objects
        for (const timestamp of (0, time_1.getDatesBetween)(startDate, Date.now(), (0, time_1.daysInMs)(1))) {
            // await this.fetchTreasuryReserves(timestamp);
            const positions = await this.treasuryManager.getPositions("329365", "1464253357814", {
                fileType: "csv",
                fileName: "USDXX_holdings",
                dataType: "fund",
                asOfDate: (0, dateformat_1.default)(timestamp, "yyyymmdd"), // yyyymmdd
            });
            if (!positions?.length)
                continue;
            const grouped = lodash_1.default.groupBy(positions, "asset");
            const summed = Object.fromEntries(Object.entries(grouped).map(([asset, group]) => [asset, lodash_1.default.sumBy(group, "par")]));
            const res = {
                timestamp: (0, string_formatting_1.toISOString)(timestamp),
                underlying: summed,
            };
            await (0, csv_1.writeToCsv)(csvPath, res, "timestamp");
        }
    }
    async fetchLatestCashReserves() {
        const csvPath = `${this.recordsPath}/cash.csv`;
        const lastEntry = await (0, cache_1.getLatest)(csvPath);
        // Check if the latest records are of the same day. If yes, don't fetch, as there can be no newer data.
        if (lastEntry !== null && (0, time_1.isClose)(lastEntry.timestamp, Date.now(), (0, time_1.hoursInMs)(23.99)))
            return;
        const $ = await new Promise((resolve, reject) => {
            this.crawler.direct({
                uri: "https://www.circle.com/en/usdc",
                callback: (error, response) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(response.$);
                    }
                },
            });
        });
        const dateText = $(".graph-title").next("h6")[0].children[0]?.data?.trim();
        const cashText = $("#usdc_chartjs_canvas")[0].attribs["data-usdc-cash"];
        if (!dateText || !cashText)
            return;
        const parsedDate = Date.parse(dateText);
        if (lastEntry !== null && !(0, time_1.isNewer)(lastEntry.timestamp, parsedDate, (0, time_1.hoursInMs)(12)))
            return;
        const cashUsd = parseFloat(cashText) * 1000000000;
        const entry = {
            timestamp: (0, dateformat_1.default)(parsedDate, "yyyy-mm-dd"),
            underlying: {
                "rwa:USD": cashUsd,
            },
        };
        await (0, csv_1.writeToCsv)(csvPath, entry, "timestamp");
    }
    async fetchLatestBacking() {
        const csvPath = `${this.recordsPath}/backing.csv`;
        const lastEntry = await (0, cache_1.getLatest)(csvPath);
        // Check if the latest records are of the same day. If yes, don't fetch, as there can be no newer data.
        if (lastEntry !== null && (0, time_1.isClose)(lastEntry.timestamp, Date.now(), (0, time_1.hoursInMs)(23.99)))
            return;
        const startDate = new Date(lastEntry?.timestamp ?? 0);
        // Loop through the dates using timestamps and create Date objects
        for (const timestamp of (0, time_1.getDatesBetween)(startDate, Date.now(), (0, time_1.daysInMs)(1))) {
            const treasuryReserves = await (0, cache_1.getClosest)(`${this.recordsPath}/reserves.csv`, timestamp, (0, time_1.hoursInMs)(12.0));
            if (!treasuryReserves)
                continue;
            const cashReserves = await (0, cache_1.getClosest)(`${this.recordsPath}/cash.csv`, timestamp, (0, time_1.hoursInMs)(12.0));
            if (!cashReserves)
                continue;
            const res = {
                timestamp: (0, string_formatting_1.toISOString)(timestamp),
                underlying: lodash_1.default.mergeWith(treasuryReserves.underlying, cashReserves.underlying, (a, b) => lodash_1.default.sum([a, b])),
            };
            await (0, csv_1.writeToCsv)(csvPath, res, "timestamp");
        }
    }
    async update() {
        // Update Circle reserves data.
        await fs_1.default.promises.mkdir(this.recordsPath, { recursive: true });
        await this.fetchLatestTreasuryReserves();
        await this.fetchLatestCashReserves();
        await this.fetchLatestBacking();
    }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map