import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Wrapped Ether",
    symbol: "WETH",
    identifier: {
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "ethereum",
    },
    reference: "https://ethereum.org/en/",
    tags: ["wrapped-token"],
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
        const { timestamp, issued, burned } = await this.chain.getSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [
            {
                timestamp,
                circulating: null,
                burned: burned ?? null,
                total: burned ? issued - burned : issued,
                issued: issued,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        // Retrieve ETH holdings in WETH contract.
        const { timestamp, balance } = await this.chain.getBalance(
            details.identifier.address,
            null,
            details.identifier.system
        );
        return [
            {
                timestamp,
                underlying: {
                    "ethereum:ETH": balance,
                },
            },
        ];
    }
}
