"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForexData = void 0;
/**
 * Provides an interface to the Swissquote API.
 * All attribution goes to the Swissquote API.
 */
const _ = require("lodash");
const json_api_1 = require("../primitive/json_api");
const string_formatting_1 = require("../primitive/string_formatting");
class ForexData {
    constructor() {
        this.api = new json_api_1.JsonApi(`https://forex-data-feed.swissquote.com`);
    }
    getUrl(asset) {
        return `/public-quotes/bboquotes/instrument/${asset}/USD`;
    }
    async getPrice(identifier) {
        if (identifier.system != "rwa")
            throw new Error(`Forex data for a non RWA was requested: ${identifier.address}`);
        const url = this.getUrl(identifier.address);
        const quotes = await this.api.fetchJson(url);
        const quote = _.find(quotes, { topo: { platform: "MT5" } });
        if (quote == undefined)
            throw new Error(`No Best Book Quote found for ${identifier.address}.`);
        const spreadProfilePrice = _.find(quote.spreadProfilePrices, { spreadProfile: "Standard" });
        if (spreadProfilePrice == undefined)
            throw new Error(`No Spread Profile Price found for ${identifier.address}.`);
        return {
            timestamp: (0, string_formatting_1.toISOString)(quote.ts),
            usd: spreadProfilePrice.ask,
        };
    }
}
exports.ForexData = ForexData;
//# sourceMappingURL=forex_data.js.map