import { ApiProxy } from "../../src/utils/apis/proxy";
import { ChainProxy } from "../../src/utils/chains/proxy";

const details: bcked.asset.Details = {
    name: "Binance USD",
    symbol: "BUSD",
    identifier: {
        address: "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "paxos",
    },
    reference: "https://paxos.com/busd/",
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

    async getPrice(): Promise<bcked.asset.Price | null> {
        const price = await this.api.getPrice(details.identifier);
        return price ?? null;
    }

    async getSupply(): Promise<bcked.asset.Supply | null> {
        const { timestamp, issued, burned } = await this.chain.getSupply(
            details.identifier.address,
            details.identifier.system
        );
        return {
            timestamp,
            circulating: null,
            burned: burned ?? null,
            total: burned ? issued - burned : issued,
            issued: issued,
            max: null,
        };
    }

    async getBacking(): Promise<bcked.asset.Backing | null> {
        // Backing need to be manually parsed from attestation reports.
        // See: https://paxos.com/busd-transparency/
        // Treasury Auctions can be looked up here: https://www.treasurydirect.gov/auctions/auction-query/
        return null;
    }
}
