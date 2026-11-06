/** USD1 by World Liberty Financial on Tron, see tokens/usd1. */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "USD1",
    symbol: "USD1",
    identifier: {
        address: "TPFqcBAaaUMCSVRCqPaQ9QnzKhmuoLR6Rc",
        system: "tron",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "world-liberty-financial",
    },
    reference: "https://docs.worldlibertyfinancial.com/usd1-token/contract-addresses",
    tags: ["stablecoin", "real-world-asset"],
    token: "usd1",
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
