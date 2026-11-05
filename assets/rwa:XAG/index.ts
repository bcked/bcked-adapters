import { ApiProxy } from "../../src/crawler/apis/proxy";

const details: bcked.asset.Details = {
    name: "Silver",
    symbol: "XAG", // XAG is the symbol used for silver in the forex market, from the chemical symbol Ag.
    identifier: {
        address: "XAG",
        system: "rwa",
    },
    assetClasses: ["commodity", "tangible-asset"],
    linkedEntities: {},
    reference: null,
    tags: [],
};

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;

    constructor() {
        this.api = new ApiProxy();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    /**
     * Silver price in USD per troy ounce, from Chainlink's XAG/USD feed on Ethereum.
     */
    async getPrice(): Promise<bcked.asset.Price[]> {
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        // No source for the silver supply yet.
        return [];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        // There is no backing for silver
        return [];
    }
}
