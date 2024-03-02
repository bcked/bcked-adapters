"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForexData = void 0;
/**
 * Provides an interface to the Swissquote API.
 * All attribution goes to the Swissquote API.
 */
const lodash_1 = __importDefault(require("lodash"));
const requests_1 = require("../../utils/requests");
const string_formatting_1 = require("../../utils/string_formatting");
class ForexData {
    constructor() {
        this.api = new requests_1.JsonApi(`https://forex-data-feed.swissquote.com`);
    }
    getUrl(asset) {
        return `/public-quotes/bboquotes/instrument/${asset}/USD`;
    }
    async getPrice(identifier) {
        if (identifier.system != "rwa")
            throw new Error(`Forex data for a non RWA was requested: ${identifier.address}`);
        const url = this.getUrl(identifier.address);
        const quotes = await this.api.fetchJson(url);
        const quote = lodash_1.default.find(quotes, { topo: { platform: "MT5" } });
        if (quote == undefined)
            throw new Error(`No Best Book Quote found for ${identifier.address}.`);
        const spreadProfilePrice = lodash_1.default.find(quote.spreadProfilePrices, { spreadProfile: "Standard" });
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