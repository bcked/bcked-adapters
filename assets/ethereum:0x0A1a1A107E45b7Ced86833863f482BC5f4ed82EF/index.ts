/**
 * USDai on Ethereum, bridged from Arbitrum through LayerZero, see src/crawler/adapters/usdai.ts.
 *
 * Supply is the token's totalSupply, read on-chain.
 *
 * The price comes from the Chainlink USDai/USD feed on Arbitrum. The backing is the Ethereum share of
 * the PYUSD held by the USDai contract on Arbitrum. The icon is generic: USD.AI's terms do not allow
 * using its marks without written consent.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { usdaiBacking } from "../../src/crawler/adapters/usdai";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "USDai",
    symbol: "USDai",
    identifier: {
        address: "0x0A1a1A107E45b7Ced86833863f482BC5f4ed82EF",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "usdai",
    },
    reference: "https://docs.usd.ai/technical-overview/contract-addresses",
    tags: ["stablecoin"],
    token: "usdai",
    backing: {
        method: "on-chain",
        description:
            "The PYUSD held by the USDai contract on Arbitrum, which backs USDai on all chains, read from the chain every hour. USDai on Ethereum gets the share of its supply.",
        reference: "https://docs.usd.ai/depositor/usdai",
        address: "0x0A1a1A107E45b7Ced86833863f482BC5f4ed82EF",
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
        // Minted by the USDai OAdapter on Ethereum for USDai burned on another chain.
        const circulating = await onChainSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [
            {
                timestamp: toISOString(Date.now()),
                circulating,
                burned: null,
                total: null,
                issued: null,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        const [supply] = await this.getSupply();
        return [await usdaiBacking(this.chain, supply!.circulating!)];
    }
}
