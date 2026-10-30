import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

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
    warning: {
        text: "Discontinued: Paxos stopped minting BUSD on February 21, 2023, on order of the New York State Department of Financial Services. Only the remaining tokens are left.",
        date: "2023-02-21",
        reference: "https://www.dfs.ny.gov/consumers/alerts/Paxos_and_Binance",
    },
    backing: {
        method: "reports",
        description: "Monthly attestation reports of Paxos, with the reserves by type of holding.",
        reference: "https://paxos.com/busd-transparency/",
        reports: "asset",
    },
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
        // See: https://paxos.com/busd-transparency/
        // Treasury Auctions can be looked up here: https://www.treasurydirect.gov/auctions/auction-query/
        return [];
    }
}
