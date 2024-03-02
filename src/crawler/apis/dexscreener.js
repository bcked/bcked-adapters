"use strict";
/**
 * Provides an interface to the Dexscreener API.
 * All attribution goes to the Dexscreener API.
 * API documentation: https://docs.dexscreener.com/api/reference
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dexscreener = void 0;
const lodash_1 = __importDefault(require("lodash"));
const array_1 = require("../../utils/array");
const helper_1 = require("../../utils/helper");
const math_1 = require("../../utils/math");
const requests_1 = require("../../utils/requests");
const string_formatting_1 = require("../../utils/string_formatting");
const URL_MAX_LENGTH = 2048;
const FETCH_MAX_COUNT = 30;
class Dexscreener {
    constructor() {
        this.api = new requests_1.JsonApi("https://api.dexscreener.com");
    }
    getPriceRoute(tokens) {
        return `/latest/dex/tokens/${tokens}`;
    }
    async _getPrices(identifiers) {
        const keyToContracts = Object.fromEntries(identifiers.map((identifier) => [
            `${identifier.system}:${identifier.address}`,
            identifier,
        ]));
        const priceRoute = this.getPriceRoute(Object.keys(keyToContracts).join(","));
        const response = await this.api.fetchJson(priceRoute);
        const pairs = response.pairs ?? [];
        const tokenPairs = pairs.filter((pair) => pair.baseToken.address in keyToContracts);
        const pairsPerToken = lodash_1.default.groupBy(tokenPairs, "baseToken.address");
        const pricePerToken = Object.fromEntries(Object.entries(pairsPerToken)
            .map(([address, pairs]) => [
            (0, helper_1.toId)(keyToContracts[address]),
            keyToContracts[address].system,
            pairs,
        ])
            .map(([id, chain, pairs]) => [
            id,
            pairs.filter((pair) => pair.chainId == chain),
        ])
            .map(([id, pairs]) => [
            id,
            {
                timestamp: (0, string_formatting_1.toISOString)(Date.now()),
                usd: (0, math_1.median)(lodash_1.default.map(pairs, "priceUsd")),
            },
        ]));
        return pricePerToken;
    }
    async getPrices(identifiers) {
        const groups = (0, array_1.groupWhile)(identifiers, (group) => (this.api.baseURL + this.getPriceRoute(lodash_1.default.map(group, "token.address").join(",")))
            .length <= URL_MAX_LENGTH && group.length <= FETCH_MAX_COUNT);
        const prices = await Promise.all(groups.map((group) => this._getPrices(group)));
        return lodash_1.default.merge({}, ...prices);
    }
    async getPrice(identifier) {
        return (await this.getPrices([identifier]))[(0, helper_1.toId)(identifier)];
    }
}
exports.Dexscreener = Dexscreener;
//# sourceMappingURL=dexscreener.js.map