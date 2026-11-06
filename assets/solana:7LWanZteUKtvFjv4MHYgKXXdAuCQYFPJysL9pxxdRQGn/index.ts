/** Circle USYC on Solana, see tokens/usyc. */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Circle USYC",
    symbol: "USYC",
    identifier: {
        address: "7LWanZteUKtvFjv4MHYgKXXdAuCQYFPJysL9pxxdRQGn",
        system: "solana",
    },
    assetClasses: ["fund", "derivative"],
    linkedEntities: {
        issuer: "circle",
    },
    reference: "https://developers.circle.com/tokenized/usyc/smart-contracts",
    tags: ["real-world-asset"],
    token: "usyc",
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
