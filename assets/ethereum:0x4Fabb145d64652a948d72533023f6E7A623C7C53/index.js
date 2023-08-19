"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const proxy_1 = require("../../src/utils/apis/proxy");
const proxy_2 = require("../../src/utils/chains/proxy");
const details = {
    name: "Binance USD",
    symbol: "BUSD",
    identifier: {
        address: "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "paxos",
    },
    reference: "https://paxos.com/busd/",
    tags: ["stablecoin", "real-world-asset"],
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
        // Backing need to be manually parsed from attestation reports.
        // See: https://paxos.com/busd-transparency/
        // Treasury Auctions can be looked up here: https://www.treasurydirect.gov/auctions/auction-query/
        return [];
    }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map