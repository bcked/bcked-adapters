/**
 * My OnChain Net Yield Fund (MONY) on Ethereum, a tokenized money market fund of J.P. Morgan Asset
 * Management, issued through Kinexys Digital Assets. One token is one fund share. The fund invests in
 * US Treasury securities and repurchase agreements collateralized by them and seeks a stable NAV of
 * $1.00 per share (https://am.jpmorgan.com/us/en/asset-management/institutional/about-us/media/press-releases/jp-morgan-asset-management-launches-its-first-tokenized-money-market-fund/).
 * The supply is read on-chain. There is no Chainlink feed for its NAV, so no price is recorded. Its
 * holdings are not published in a source whose terms allow automated collection, so the backing is
 * not recorded. The icon is generic: J.P. Morgan's terms do not allow using its logo without consent.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "My OnChain Net Yield Fund",
    symbol: "MONY",
    identifier: {
        address: "0x6a7c6aa2b8b8a6A891dE552bDEFFa87c3F53bD46",
        system: "ethereum",
    },
    assetClasses: ["fund", "cash-equivalent"],
    linkedEntities: {
        issuer: "jpmorgan",
    },
    reference:
        "https://am.jpmorgan.com/us/en/asset-management/institutional/about-us/media/press-releases/jp-morgan-asset-management-launches-its-first-tokenized-money-market-fund/",
    backing: {
        method: "not-tracked",
        description: "J.P. Morgan publishes no holdings of the fund that bcked can record.",
        reference: null,
    },
    tags: ["real-world-asset"],
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
