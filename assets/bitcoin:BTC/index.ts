/**
 * The BTC price is queried using the BitGo API.
 * All attribution goes to the [BitGo API](https://developers.bitgo.com/).
 *
 * The block height to calculate supply is queried using the Blockstream API.
 * All attribution goes to the [Blockstream API](https://github.com/Blockstream/esplora/blob/master/API.md).
 */
import { JsonApi } from "../../src/utils/primitive/requests";
import { toISOString } from "../../src/utils/primitive/string_formatting";

const details: bcked.asset.Details = {
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

function computeIssuedSupply(blockHeight: number) {
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

interface BitGoPriceResponse {
    latest: {
        date: primitive.ISODateTimeString;
        blockchain: { cacheTime: number; totalbc: number; transactions: number };
        currencies: {
            USD: {
                "24h_avg": number;
                bid: number;
                ask: number;
                monthlyLow: number;
                monthlyHigh: number;
                prevDayLow: number;
                prevDayHigh: number;
                lastHourLow: number;
                lastHourHigh: number;
                last: number;
                timestamp: number;
                cacheTime: number;
            };
        };
        coin: "btc";
    };
}

export default class Adapter implements bcked.asset.Adapter {
    bitgoApi: JsonApi;
    blockstreamApi: JsonApi;

    constructor() {
        // See also: https://developers.bitgo.com/
        this.bitgoApi = new JsonApi("https://www.bitgo.com/api");
        this.blockstreamApi = new JsonApi("https://blockstream.info/api");
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        const response = await this.bitgoApi.fetchJson<BitGoPriceResponse>("/v2/btc/market/latest");
        const usdPrice = response.latest.currencies.USD;
        return [
            {
                timestamp: toISOString(usdPrice.timestamp),
                usd: usdPrice.ask,
            },
        ];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const blockHeight = await this.blockstreamApi.fetchJson<number>("/blocks/tip/height");
        const totalSupply = computeIssuedSupply(blockHeight);

        return [
            {
                timestamp: toISOString(Date.now()),
                circulating: null,
                burned: null,
                total: null,
                issued: totalSupply,
                max: 21000000,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        // There is no backing for BTC
        return [];
    }
}
