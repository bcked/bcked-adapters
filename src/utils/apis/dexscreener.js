"use strict";
/**
 * Provides an interface to the Dexscreener API.
 * API documentation: https://docs.dexscreener.com/api/reference
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dexscreener = void 0;
const _ = require("lodash");
const helper_1 = require("../helper");
const array_1 = require("../primitive/array");
const json_api_1 = require("../primitive/json_api");
const math_1 = require("../primitive/math");
const string_formatting_1 = require("../primitive/string_formatting");
const URL_MAX_LENGTH = 2048;
const FETCH_MAX_COUNT = 30;
class Dexscreener {
    constructor() {
        this.api = new json_api_1.JsonApi("https://api.dexscreener.com");
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
        const pairsPerToken = _.groupBy(tokenPairs, "baseToken.address");
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
                usd: (0, math_1.median)(_.map(pairs, "priceUsd")),
            },
        ]));
        return pricePerToken;
    }
    async getPrices(identifiers) {
        const groups = (0, array_1.groupWhile)(identifiers, (group) => (this.api.baseURL + this.getPriceRoute(_.map(group, "token.address").join(",")))
            .length <= URL_MAX_LENGTH && group.length <= FETCH_MAX_COUNT);
        const prices = await Promise.all(groups.map((group) => this._getPrices(group)));
        return _.merge({}, ...prices);
    }
    async getPrice(identifier) {
        return (await this.getPrices([identifier]))[(0, helper_1.toId)(identifier)];
    }
}
exports.Dexscreener = Dexscreener;
//# sourceMappingURL=dexscreener.js.map