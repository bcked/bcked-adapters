import { ApiProxy } from "../../src/utils/apis/proxy";
import { ChainProxy } from "../../src/utils/chains/proxy";

const details: bcked.asset.Details = {
    name: "Tether USD",
    symbol: "USDT",
    identifier: {
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "tether",
    },
    reference: "https://tether.to/en/transparency/",
    tags: ["stablecoin", "real-world-asset"],
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
        // Backing need to be manually parsed from attestation reports.
        // See: https://tether.to/en/transparency/
        // Treasury Auctions can be looked up here: https://www.treasurydirect.gov/auctions/auction-query/
        return [];
    }
}
