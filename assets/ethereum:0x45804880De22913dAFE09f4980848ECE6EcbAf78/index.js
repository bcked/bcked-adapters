"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const proxy_1 = require("../../src/utils/apis/proxy");
const proxy_2 = require("../../src/utils/chains/proxy");
const details = {
    name: "PAX Gold",
    symbol: "PAXG",
    identifier: {
        address: "0x45804880De22913dAFE09f4980848ECE6EcbAf78",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative", "commodity", "tangible-asset"],
    linkedEntities: {
        issuer: "paxos",
    },
    reference: "https://paxos.com/paxgold/",
    tags: ["real-world-asset"],
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
        // See: https://paxos.com/paxg-transparency/
        return [];
    }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map