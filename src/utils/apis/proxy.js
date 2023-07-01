"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiProxy = void 0;
const helper_1 = require("../helper");
const instance_proxy_1 = require("../primitive/instance_proxy");
const cache_1 = require("./cache");
const defillama_1 = require("./defillama");
const dexscreener_1 = require("./dexscreener");
class ApiProxy extends instance_proxy_1.InstanceProxy {
    constructor(cached = true) {
        super({
            ...(cached && { cache: cache_1.Cache }),
            defillama: defillama_1.DefiLlama,
            dexscreener: dexscreener_1.Dexscreener,
        });
    }
    async getPrices(identifiers) {
        let prices = {};
        for (const api of this.instances) {
            prices = {
                ...prices,
                ...(await api.getPrices(identifiers.filter((identifier) => !prices[(0, helper_1.toId)(identifier)]))),
            };
            if (identifiers.every((identifier) => prices[(0, helper_1.toId)(identifier)]))
                break; // Stop iterating if all prices are known
        }
        return prices;
    }
    async getPrice(identifier) {
        return (await this.getPrices([identifier]))[(0, helper_1.toId)(identifier)];
    }
}
exports.ApiProxy = ApiProxy;
//# sourceMappingURL=proxy.js.map