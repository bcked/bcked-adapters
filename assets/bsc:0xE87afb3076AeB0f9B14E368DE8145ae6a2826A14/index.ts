/**
 * Strategy (bStocks) on BNB Chain, a tokenized certificate on Strategy Inc. shares (MSTR).
 * bStocks are BEP-20 tokens on BNB Chain, issued by a Binance group company:
 * https://www.bnbchain.org/en/blog/introducing-bstocks-on-bnb-chain-trade-24-7-with-zero-fees-deploy-across-defi-protocols-with-full-self-custody
 * The contract reports name "Strategy Inc." and symbol "MSTRB" on-chain.
 *
 * Supply is the token's totalSupply, read on-chain. There is no on-chain Chainlink feed for MSTR,
 * so there is no price. The shares held as collateral are not recorded: Binance publishes them on
 * its Proof of Collateral page (https://www.binance.com/en/proof-of-collateral/bstocks), which is not
 * used until Binance's terms allow automated collection.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Strategy (bStocks)",
    symbol: "MSTRB",
    identifier: {
        address: "0xE87afb3076AeB0f9B14E368DE8145ae6a2826A14",
        system: "bsc",
    },
    assetClasses: ["stock", "derivative"],
    linkedEntities: {
        issuer: "binance",
    },
    reference: "https://www.binance.com/en/bstocks-landing",
    tags: ["real-world-asset"],
};

export default class Adapter implements bcked.asset.Adapter {
    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        return [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        // totalSupply of the token contract, read on-chain.
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
        return [];
    }
}
