"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The WBTC backing is queried using the WBTC API.
 * All attribution goes to the WBTC API.
 */
const ethers_1 = require("ethers");
const proxy_1 = require("../../src/crawler/apis/proxy");
const proxy_2 = require("../../src/crawler/chains/proxy");
const requests_1 = require("../../src/utils/requests");
const string_formatting_1 = require("../../src/utils/string_formatting");
const details = {
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    identifier: {
        address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "bitgo",
    },
    reference: "https://wbtc.network/dashboard/audit",
    tags: ["bridged-asset"],
};
class Adapter {
    constructor() {
        this.api = new proxy_1.ApiProxy();
        this.chain = new proxy_2.ChainProxy();
        this.wbtcApi = new requests_1.JsonApi("https://wbtc.network/api");
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
        // As an alternative to relying on the wbtc API, one could do the following:
        // Track list (json or yml) of custodian addresses.
        // Load and update custodian list from: https://wbtc.network/api/chain/eth/token/wbtc/addresses?type=custodial
        // Query custodian addresses for holdings via Blockstream API: https://github.com/Blockstream/esplora/blob/master/API.md
        const response = await this.wbtcApi.fetchJson("/chain/eth/token/wbtc");
        // Convert holdings from satoshis to bitcoins
        const holdings = parseFloat(ethers_1.utils.formatUnits(response.holdings, 8));
        return [
            {
                timestamp: (0, string_formatting_1.toISOString)(Date.now()),
                underlying: {
                    "bitcoin:BTC": holdings,
                },
            },
        ];
    }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map