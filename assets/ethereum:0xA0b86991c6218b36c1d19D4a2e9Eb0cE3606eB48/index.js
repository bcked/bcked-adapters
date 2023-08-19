"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const proxy_1 = require("../../src/utils/apis/proxy");
const proxy_2 = require("../../src/utils/chains/proxy");
const time_1 = require("../../src/utils/primitive/time");
const details = {
    name: "USD Coin",
    symbol: "USDC",
    identifier: {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "circle",
    },
    reference: "https://www.circle.com/en/usdc",
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
    async getBacking(lastRecorded) {
        // Backing is determined by Circle's reserves, tracked for Circle as an entity.
        if (lastRecorded !== null && (0, time_1.isClose)(lastRecorded.timestamp, Date.now(), (0, time_1.hoursInMs)(23.99)))
            return [];
        // const startDate = new Date(lastRecorded?.timestamp ?? 0);
        // const circleAdapter = new CircleAdapter();
        // TODO iterate all dates since last entry.
        // TODO get circle backing of each day
        // TODO get the supply of all chains USDC is deployed to
        // TODO calculate the share of the backing for the current chain
        return [];
    }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map