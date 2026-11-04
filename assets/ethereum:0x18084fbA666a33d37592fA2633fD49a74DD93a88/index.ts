/**
 * tBTC on Ethereum, its native chain, see src/crawler/adapters/tbtc.ts. Threshold lists the
 * contract in its docs.
 *
 * Supply is read on-chain. tBTC bridged to other chains is locked in bridge contracts on Ethereum,
 * so the circulating supply on Ethereum excludes their balances. The price comes from Chainlink's
 * TBTC / USD feed on Ethereum.
 *
 * The backing is the Ethereum share of the bitcoin the tBTC Bridge has credited to the TBTCVault.
 * The icon is the tBTC token mark from Threshold's brand guide.
 */
import {
    TBTC_BACKING_DESCRIPTION,
    TBTC_LOCKED,
    TBTC_VAULT,
    tbtcBacking,
} from "../../src/crawler/adapters/tbtc";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "tBTC",
    symbol: "tBTC",
    identifier: {
        address: "0x18084fbA666a33d37592fA2633fD49a74DD93a88",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "threshold",
    },
    reference: "https://docs.threshold.network/contract-addresses/tbtc",
    tags: ["bridged-asset"],
    token: "tbtc",
    backing: {
        method: "on-chain",
        description: TBTC_BACKING_DESCRIPTION,
        reference: "https://docs.threshold.network/tbtc-v2",
        address: TBTC_VAULT,
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
        const { address, system } = details.identifier;
        const [{ timestamp, issued, burned }, ...balances] = await Promise.all([
            this.chain.getSupply(address, system),
            ...TBTC_LOCKED.map((holder) => this.chain.getBalance(holder, address, system)),
        ]);
        const locked = balances.reduce((sum, { balance }) => sum + balance, 0);
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
        return [await tbtcBacking(this.chain, supply!.circulating!)];
    }
}
