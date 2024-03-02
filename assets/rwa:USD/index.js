"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requests_1 = require("../../src/utils/requests");
const string_formatting_1 = require("../../src/utils/string_formatting");
const details = {
    name: "U.S. dollar",
    symbol: "USD",
    identifier: {
        address: "USD",
        system: "rwa",
    },
    assetClasses: ["fiat-money", "cash"],
    linkedEntities: { issuer: "fed" },
    reference: null,
    tags: [],
};
class Adapter {
    constructor() {
        this.api = new requests_1.CsvApi("https://www.federalreserve.gov");
    }
    async getDetails() {
        return details;
    }
    async getPrice() {
        return [
            {
                timestamp: (0, string_formatting_1.toISOString)(new Date(0)),
                usd: 1.0,
            },
        ];
    }
    getSupplyUrl(options) {
        return `/datadownload/Output.aspx?${(0, requests_1.joinOptions)(options)}`;
    }
    async getSupply() {
        const url = this.getSupplyUrl({
            rel: "H6",
            series: "f14e8c98effb12bfe9ff8ee15bc760a3",
            lastobs: 1,
            filetype: "csv",
            label: "omit",
            layout: "seriescolumn",
        });
        const supplies = await this.api.fetchCsv(url, { columns: true, from_line: 2 });
        if (!supplies?.length)
            return [];
        const supply = supplies[0];
        const billion = 1000 * 1000 * 1000;
        return [
            {
                timestamp: (0, string_formatting_1.toISOString)(new Date(supply["Time Period"])),
                burned: null,
                circulating: supply["MCU_N.WM"] * billion,
                total: supply["M2_N.WM"] * billion,
                issued: supply["M2_N.WM"] * billion,
                max: null,
            },
        ];
    }
    async getBacking() {
        // There is no backing for USD
        return [];
    }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map