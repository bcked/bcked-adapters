/**
 * Strategy's Variable Rate Series A Perpetual Stretch Preferred Stock (STRC), listed on Nasdaq. The
 * collateral of STRCx (tokens/strcx), which is backed 1:1 by STRC shares. Priced by Chainlink's
 * STRC/USD feed on Ethereum, US dollars per share.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";

const details: bcked.asset.Details = {
    name: "Strategy Variable Rate Series A Perpetual Stretch Preferred Stock",
    symbol: "STRC",
    identifier: {
        address: "STRC",
        system: "rwa",
    },
    assetClasses: ["equity", "stock"],
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
        // Chainlink's STRC/USD feed, US dollars per share.
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        return [];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
