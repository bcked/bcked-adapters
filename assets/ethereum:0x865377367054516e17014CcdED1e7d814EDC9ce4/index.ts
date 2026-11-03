/**
 * DOLA, the stablecoin of Inverse Finance, on Ethereum. Its reserves are read on-chain, see
 * src/crawler/adapters/inverse.ts. DOLA on other chains is bridged from Ethereum and is not tracked
 * here.
 */
import { getDolaReserves } from "../../src/crawler/adapters/inverse";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "DOLA",
    symbol: "DOLA",
    identifier: {
        address: "0x865377367054516e17014CcdED1e7d814EDC9ce4",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "inverse",
    },
    reference: "https://docs.inverse.finance/inverse-finance/inverse-finance/products/tokens/dola",
    tags: ["stablecoin"],
    backing: {
        method: "on-chain",
        description:
            "Read on-chain from the Inverse Finance contracts: the DOLA lent in the FiRM markets, counted as loans, and the USDS reserves of the Peg Stability Module. The collateral of the FiRM loans is not traced yet. Circulating DOLA that these do not cover, such as loans of the deprecated Frontier protocol, is counted as not traced.",
        reference:
            "https://docs.inverse.finance/inverse-finance/inverse-finance/products/dola-feds",
        address: "0x2b34548b865ad66A2B046cb82e59eE43F75B90fd",
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
        const { timestamp, issued, circulating } = await getDolaReserves(this.chain);
        return [{ timestamp, circulating, burned: null, total: issued, issued, max: null }];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        const { timestamp, underlying } = await getDolaReserves(this.chain);
        return [{ timestamp, underlying }];
    }
}
