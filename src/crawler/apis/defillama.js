"use strict";
/**
 * Provides an interface to the DefiLlama API.
 * All attribution goes to the DefiLlama API.
 * API documentation: https://defillama.com/docs/api
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefiLlama = void 0;
const lodash_1 = __importDefault(require("lodash"));
const helper_1 = require("../../utils/helper");
const requests_1 = require("../../utils/requests");
const string_formatting_1 = require("../../utils/string_formatting");
class DefiLlama {
    constructor() {
        this.api = new requests_1.JsonApi("https://coins.llama.fi");
    }
    getPriceRoute(tokens, searchWidth = "4h") {
        return `/prices/current/${tokens}?searchWidth=${searchWidth}`;
    }
    async _getPrices(identifiers) {
        const keyToId = Object.fromEntries(identifiers.map((identifier) => [
            `${identifier.system}:${identifier.address}`,
            (0, helper_1.toId)(identifier),
        ]));
        const priceRoute = this.getPriceRoute(Object.keys(keyToId).join(","));
        const response = await this.api.fetchJson(priceRoute);
        const coins = response.coins;
        return Object.fromEntries(Object.entries(keyToId)
            .map(([key, id]) => [id, coins[key]])
            .map(([id, coin]) => [
            id,
            coin
                ? {
                    timestamp: (0, string_formatting_1.toISOString)(coin.timestamp > 1775369079 ? coin.timestamp : Date.now() // If default date, take the current one.
                    ),
                    usd: coin.price,
                }
                : null,
        ]));
    }
    async getPrices(identifiers) {
        const groups = (0, requests_1.urlLengthGrouping)(identifiers, this.api.baseURL, (group) => this.getPriceRoute(group.map((identifier) => `${identifier.system}:${identifier.address}`).join(",")));
        const prices = await Promise.all(groups.map((group) => this._getPrices(group)));
        return lodash_1.default.merge({}, ...prices);
    }
    async getPrice(identifier) {
        return (await this.getPrices([identifier]))[(0, helper_1.toId)(identifier)];
    }
}
exports.DefiLlama = DefiLlama;
//# sourceMappingURL=defillama.js.map