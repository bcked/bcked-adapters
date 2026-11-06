/** USD1 by World Liberty Financial on Aptos, see tokens/usd1. */
import { porBackingShare } from "../../src/crawler/adapters/por_share";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { USD1_ASSETS, USD1_POR } from "../../tokens/usd1";

const details: bcked.asset.Details = {
    name: "USD1",
    symbol: "USD1",
    identifier: {
        address: "0x05fabd1b12e39967a3c24e91b7b8f67719a6dacee74f3c8b9fb7d93e855437d2",
        system: "aptos",
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

    async getBacking(lastRecorded: bcked.asset.Backing | null): Promise<bcked.asset.Backing[]> {
        const { address, system } = details.identifier;
        return porBackingShare(USD1_POR, USD1_ASSETS, `${system}:${address}`, lastRecorded);
    }
}
