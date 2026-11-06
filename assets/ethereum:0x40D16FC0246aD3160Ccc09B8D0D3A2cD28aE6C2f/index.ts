/**
 * GHO on Ethereum, the stablecoin of the Aave protocol. The address is listed in Aave's address book
 * (https://github.com/bgd-labs/aave-address-book, MIT). Supply is the token's totalSupply. GHO on
 * other chains is not tracked separately. The price is the Chainlink GHO/USD feed.
 *
 * The backing is not recorded yet. GHO is minted by several facilitators: the Aave pool (GHO borrowed
 * against collateral), the GHO stability modules (holding USDC and USDT) and direct minters into Aave
 * markets. Each needs its own on-chain reading, which is not built yet.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "GHO",
    symbol: "GHO",
    identifier: {
        address: "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "aave",
    },
    reference: "https://github.com/bgd-labs/aave-address-book",
    backing: {
        method: "not-tracked",
        description:
            "GHO is backed by the positions of several facilitators on-chain (loans in the Aave pool, USDC and USDT in the stability modules), which bcked does not read yet.",
        reference: "https://aave.com/docs/developers/gho",
    },
    tags: ["stablecoin"],
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
