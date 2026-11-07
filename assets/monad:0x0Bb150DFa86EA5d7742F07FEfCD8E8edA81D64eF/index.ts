/**
 * Saturn Dollar (USDat) on Monad, bridged from Ethereum through Chainlink CCIP, see
 * src/crawler/adapters/usdat.ts. Saturn lists the token address in its docs.
 *
 * Supply is the token's totalSupply, read on-chain. There is no Chainlink feed for USDat, so there is
 * no price. The backing is the BNB Chain share of the PYUSDx held by the USDat contract on Ethereum.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { usdatBacking } from "../../src/crawler/adapters/usdat";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Saturn Dollar",
    symbol: "USDat",
    identifier: {
        address: "0x0Bb150DFa86EA5d7742F07FEfCD8E8edA81D64eF",
        system: "monad",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "saturn",
    },
    reference:
        "https://saturncredit.gitbook.io/saturn-docs/operations-and-governance/key-addresses",
    tags: ["stablecoin"],
    token: "usdat",
    backing: {
        method: "on-chain",
        description:
            "The PYUSDx held by the USDat contract on Ethereum, which backs USDat on all chains, read from the chain every hour. USDat on Monad gets the share of its supply.",
        reference: "https://saturncredit.gitbook.io/saturn-docs/solution/usdat-overview",
        address: "0x23238f20b894f29041f48D88eE91131C395Aaa71",
    },
};

export default class Adapter implements bcked.asset.Adapter {
    chain: ChainProxy;

    constructor() {
        this.chain = new ChainProxy();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        return [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        // Minted by the CCIP pool on Monad for USDat locked on Ethereum.
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
        return [await usdatBacking(this.chain, supply!.circulating!)];
    }
}
