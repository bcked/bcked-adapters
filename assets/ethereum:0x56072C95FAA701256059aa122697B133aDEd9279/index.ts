/**
 * SKY, the governance token of Sky (formerly MKR). It is not backed by reserves. bcked tracks it as
 * collateral of Sky's staking vaults, which back DAI and USDS.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "SKY",
    symbol: "SKY",
    identifier: {
        address: "0x56072C95FAA701256059aa122697B133aDEd9279",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency"],
    linkedEntities: {
        issuer: "sky",
    },
    reference: "https://sky.money/",
    tags: ["governance-token"],
};

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;
    chain: ChainProxy;

    constructor() {
        this.api = new ApiProxy();
        this.chain = new ChainProxy();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { timestamp, issued } = await this.chain.getSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [{ timestamp, circulating: null, burned: null, total: issued, issued, max: null }];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
