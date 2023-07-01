"use strict";
/**
 * Provides an interface to the Price Cache.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const _ = require("lodash");
const cache_1 = require("../cache");
const helper_1 = require("../helper");
class Cache {
    async getPrices(identifiers) {
        const prices = await Promise.all(identifiers.map(async (identifier) => ({
            [(0, helper_1.toId)(identifier)]: await (0, cache_1.getCachedPrice)(identifier),
        })));
        return _.merge({}, ...prices);
    }
    async getPrice(identifier) {
        return (await this.getPrices([identifier]))[(0, helper_1.toId)(identifier)];
    }
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map