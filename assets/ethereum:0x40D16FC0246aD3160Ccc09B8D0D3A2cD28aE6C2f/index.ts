/**
 * GHO on Ethereum, the stablecoin of the Aave protocol. The address is listed in Aave's address book
 * (https://github.com/bgd-labs/aave-address-book, MIT). The price is the Chainlink GHO/USD feed.
 *
 * Supply and backing are read on-chain, see src/crawler/adapters/gho.ts: the circulating supply
 * leaves out GHO minted ahead of use, and the backing is the GHO borrowed from the Aave markets and
 * the stablecoins in the stability modules on Ethereum and the other chains, of which GHO on
 * Ethereum gets its share. GHO on other chains is not tracked separately.
 */
import { GhoReader } from "../../src/crawler/adapters/gho";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

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
        method: "on-chain",
        description:
            "GHO borrowed from the Aave markets (loans against collateral, at the borrowed amount) and the stablecoins in the GHO stability modules on Ethereum, Arbitrum, Plasma and Monad, read on-chain. GHO on Ethereum gets its share of all GHO in circulation.",
        reference: "https://aave.com/docs/developers/gho",
    },
    tags: ["stablecoin"],
};

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;
    gho: GhoReader;

    constructor() {
        this.api = new ApiProxy();
        this.gho = new GhoReader(new ChainProxy());
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { issued, circulating } = await this.gho.ethereumSupply();
        return [
            {
                timestamp: toISOString(Date.now()),
                circulating,
                burned: null,
                total: issued,
                issued,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return this.gho.ethereumBacking();
    }
}
