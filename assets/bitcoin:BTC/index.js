"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The BTC price is queried using the BitGo API.
 * All attribution goes to the [BitGo API](https://developers.bitgo.com/).
 *
 * The block height to calculate supply is queried using the Blockstream API.
 * All attribution goes to the [Blockstream API](https://github.com/Blockstream/esplora/blob/master/API.md).
 */
const requests_1 = require("../../src/utils/primitive/requests");
const string_formatting_1 = require("../../src/utils/primitive/string_formatting");
const details = {
    name: "Bitcoin",
    symbol: "BTC",
    identifier: {
        address: "BTC",
        system: "bitcoin",
    },
    assetClasses: ["cryptocurrency"],
    linkedEntities: {},
    reference: "https://ethereum.org/en/",
    tags: ["chain-token"],
};
function computeIssuedSupply(blockHeight) {
    const initialBlockReward = 50; // Initial block reward (in BTC)
    let blockReward = initialBlockReward;
    let totalSupply = 0;
    const blockCount = 210000;
    const halvingCount = Math.floor(blockHeight / blockCount);
    for (let i = 0; i < halvingCount; i++) {
        const reward = blockCount * blockReward;
        totalSupply += reward;
        blockReward /= 2;
    }
    const remainingBlocks = blockHeight % blockCount;
    const remainingReward = remainingBlocks * blockReward;
    totalSupply += remainingReward;
    return totalSupply;
}
class Adapter {
    constructor() {
        // See also: https://developers.bitgo.com/
        this.bitgoApi = new requests_1.JsonApi("https://www.bitgo.com/api");
        this.blockstreamApi = new requests_1.JsonApi("https://blockstream.info/api");
    }
    async getDetails() {
        return details;
    }
    async getPrice() {
        const response = await this.bitgoApi.fetchJson("/v2/btc/market/latest");
        const usdPrice = response.latest.currencies.USD;
        return [
            {
                timestamp: (0, string_formatting_1.toISOString)(usdPrice.timestamp),
                usd: usdPrice.ask,
            },
        ];
    }
    async getSupply() {
        const blockHeight = await this.blockstreamApi.fetchJson("/blocks/tip/height");
        const totalSupply = computeIssuedSupply(blockHeight);
        return [
            {
                timestamp: (0, string_formatting_1.toISOString)(Date.now()),
                circulating: null,
                burned: null,
                total: null,
                issued: totalSupply,
                max: 21000000,
            },
        ];
    }
    async getBacking() {
        // There is no backing for BTC
        return [];
    }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map