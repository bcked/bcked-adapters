/** Lombard Staked BTC (LBTC) on Solana, see tokens/lbtc. */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Lombard Staked BTC",
    symbol: "LBTC",
    identifier: {
        address: "LBTCgU4b3wsFKsPwBn1rRZDx5DoFutM6RPiEt1TPDsY",
        system: "solana",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "lombard",
    },
    reference: "https://docs.lombard.finance/learn/transparency/smart-contracts",
    tags: ["wrapped-token", "staking-token"],
    token: "lbtc",
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
