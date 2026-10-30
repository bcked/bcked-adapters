/**
 * The BTC price is queried using the mempool.space API, an open source Bitcoin explorer.
 * All attribution goes to [mempool.space](https://mempool.space/docs/api/rest#get-price).
 *
 * The block height to calculate supply is queried using the Blockstream API.
 * All attribution goes to the [Blockstream API](https://github.com/Blockstream/esplora/blob/master/API.md).
 */
import { JsonApi } from "../../src/utils/requests";
import { toISOString } from "../../src/utils/string_formatting";

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

interface MempoolPriceResponse {
    /** Unix time in seconds. */
    time: number;
    USD: number;
}

export default class Adapter implements bcked.asset.Adapter {
    mempoolApi: JsonApi;
    blockstreamApi: JsonApi;

    constructor() {
        this.mempoolApi = new JsonApi("https://mempool.space/api");
        this.blockstreamApi = new JsonApi("https://blockstream.info/api");
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        const response = await this.mempoolApi.fetchJson<MempoolPriceResponse>("/v1/prices");
        return [
            {
                timestamp: toISOString(response.time * 1000),
                usd: response.USD,
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
