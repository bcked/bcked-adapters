"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const proxy_1 = require("../../src/crawler/apis/proxy");
const proxy_2 = require("../../src/crawler/chains/proxy");
const details = {
    name: "Wrapped Ether",
    symbol: "WETH",
    identifier: {
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "ethereum",
    },
    reference: "https://ethereum.org/en/",
    tags: ["wrapped-token"],
};
class Adapter {
    constructor() {
        this.api = new proxy_1.ApiProxy();
        this.chain = new proxy_2.ChainProxy();
    }
    async getDetails() {
        return details;
    }
    async getPrice() {
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }
    async getSupply() {
        const { timestamp, issued, burned } = await this.chain.getSupply(details.identifier.address, details.identifier.system);
        return [
            {
                timestamp,
                circulating: null,
                burned: burned ?? null,
                total: burned ? issued - burned : issued,
                issued: issued,
                max: null,
            },
        ];
    }
    async getBacking() {
        // Retrieve ETH holdings in WETH contract.
        const { timestamp, balance } = await this.chain.getBalance(details.identifier.address, null, details.identifier.system);
        return [
            {
                timestamp,
                underlying: {
                    "ethereum:ETH": balance,
                },
            },
        ];
    }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map