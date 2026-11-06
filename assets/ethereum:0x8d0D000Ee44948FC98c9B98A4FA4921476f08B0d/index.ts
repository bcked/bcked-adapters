/** USD1 by World Liberty Financial on Ethereum, see tokens/usd1. */
import { porBackingShare } from "../../src/crawler/adapters/por_share";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { USD1_ASSETS, USD1_POR } from "../../tokens/usd1";

const details: bcked.asset.Details = {
    name: "USD1",
    symbol: "USD1",
    identifier: {
        address: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
        system: "ethereum",
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
