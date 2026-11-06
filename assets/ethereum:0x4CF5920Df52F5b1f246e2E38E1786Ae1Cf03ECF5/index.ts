/** USDGO on Ethereum, see tokens/usdgo. */
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "USDGO",
    symbol: "USDGO",
    identifier: {
        address: "0x4CF5920Df52F5b1f246e2E38E1786Ae1Cf03ECF5",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "anchorage",
    },
    reference: "https://docs.anchorage.com/knowledge-base/platform/users/stablecoins",
    tags: ["stablecoin", "real-world-asset"],
    token: "usdgo",
};

export default class Adapter implements bcked.asset.Adapter {
    chain: ChainProxy;

    constructor() {
        this.chain = new ChainProxy();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        // No Chainlink feed for USDGO.
        return [];
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
