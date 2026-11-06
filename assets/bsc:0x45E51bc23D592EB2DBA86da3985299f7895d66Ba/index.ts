/** USDD on BNB Chain, see tokens/usdd. */
import { getUsddBacking } from "../../src/crawler/adapters/usdd";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { USDD_ASSETS } from "../../tokens/usdd";

const details: bcked.asset.Details = {
    name: "USDD",
    symbol: "USDD",
    identifier: {
        address: "0x45E51bc23D592EB2DBA86da3985299f7895d66Ba",
        system: "bsc",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "usdd",
    },
    reference: "https://docs.usdd.io/developers/deployment-addresses",
    tags: ["stablecoin"],
    token: "usdd",
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
        const { address, system } = details.identifier;
        return getUsddBacking(USDD_ASSETS, `${system}:${address}`);
    }
}
