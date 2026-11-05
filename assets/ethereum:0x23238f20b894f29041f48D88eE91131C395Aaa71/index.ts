/**
 * Saturn Dollar (USDat) on Ethereum, issued by Saturn. Ethereum is its native chain, see
 * src/crawler/adapters/usdat.ts.
 *
 * Supply is read on-chain. USDat bridged to other chains is locked in the Chainlink CCIP Lock &
 * Release pool on Ethereum, so the circulating supply on Ethereum excludes the pool balance.
 * There is no Chainlink feed for USDat, so there is no price.
 *
 * The backing is the Ethereum share of the PYUSDx held by the USDat contract, read on-chain. The
 * icon is generic: Saturn's terms do not allow using its marks without written permission.
 */
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { USDAT_BRIDGE_POOL, usdatBacking } from "../../src/crawler/adapters/usdat";

const details: bcked.asset.Details = {
    name: "Saturn Dollar",
    symbol: "USDat",
    identifier: {
        address: "0x23238f20b894f29041f48D88eE91131C395Aaa71",
        system: "ethereum",
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
            "The PYUSDx held by the USDat contract on Ethereum, which backs USDat on all chains, read from the chain every hour. USDat on Ethereum gets the share of its circulating supply.",
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
        const { address, system } = details.identifier;
        const [{ timestamp, issued, burned }, { balance: locked }] = await Promise.all([
            this.chain.getSupply(address, system),
            this.chain.getBalance(USDAT_BRIDGE_POOL, address, system),
        ]);
        const total = issued - (burned ?? 0);
        return [
            {
                timestamp,
                circulating: total - locked,
                burned: burned ?? null,
                total,
                issued,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        const [supply] = await this.getSupply();
        return [await usdatBacking(this.chain, supply!.circulating!)];
    }
}
