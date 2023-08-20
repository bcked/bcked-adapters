"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forex_data_1 = require("../../src/crawler/apis/forex_data");
const details = {
    name: "Gold",
    symbol: "XAU",
    identifier: {
        address: "XAU",
        system: "rwa",
    },
    assetClasses: ["commodity", "tangible-asset"],
    linkedEntities: {},
    reference: null,
    tags: [],
};
class Adapter {
    constructor() {
        this.api = new forex_data_1.ForexData();
    }
    async getDetails() {
        return details;
    }
    /**
     * Gold price in USD/t.oz (troy ounce)
     */
    async getPrice() {
        return [await this.api.getPrice(details.identifier)];
    }
    /**
     * Source: https://www.usgs.gov/centers/national-minerals-information-center/gold-statistics-and-information
     *
     *      t.oz/ton = 1 / (480 grain * 64.79891 milligrams) / 1000 / 1000 / 1000
     * It is assumed that around 0.02% of supply is unrecoverable lost.
     *
     *  	conv = lambda x: x / ((480 * 64.79891) / 1000 / 1000 / 1000)
     *      comp = lambda w: f",{0.02*conv(w)},{0.98*conv(w)},{conv(w)},"
     */
    async getSupply() {
        return []; // Look up manually and enter in records
    }
    async getBacking() {
        // There is no backing for Gold
        return [];
    }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map