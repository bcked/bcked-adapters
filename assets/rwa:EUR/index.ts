import { ApiProxy } from "../../src/crawler/apis/proxy";

const details: bcked.asset.Details = {
    name: "Euro",
    symbol: "EUR",
    identifier: {
        address: "EUR",
        system: "rwa",
    },
    assetClasses: ["fiat-money", "cash"],
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

    async getPrice(): Promise<bcked.asset.Price[]> {
        // Chainlink's EUR/USD feed on Ethereum.
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        // No source for the euro money supply yet.
        return [];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        // There is no backing for EUR
        return [];
    }
}
