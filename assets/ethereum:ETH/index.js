"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The ETH price and supply is queried using the Etherscan API.
 * All attribution goes to the [Etherscan API](https://etherscan.io/apis).
 */
const etherscan_1 = require("../../src/crawler/apis/etherscan");
const details = {
    name: "Ether",
    symbol: "ETH",
    identifier: {
        address: "ETH",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency"],
    linkedEntities: {
        issuer: "ethereum",
    },
    reference: "https://ethereum.org/en/",
    tags: ["chain-token"],
};
class Adapter {
    constructor() {
        this.etherscan = new etherscan_1.Etherscan();
    }
    async getDetails() {
        return details;
    }
    async getPrice() {
        // Use WETH as price proxy.
        return [await this.etherscan.getEthPrice()];
    }
    async getSupply() {
        const { timestamp, issued, burned } = await this.etherscan.getEthSupply();
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
        // There is no backing for ETH
        return [];
    }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map