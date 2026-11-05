/**
 * tBTC on Arbitrum, bridged from Ethereum through Wormhole: tBTC is locked in the Wormhole Token
 * Bridge on Ethereum and minted on Arbitrum by the Arbitrum Wormhole Gateway, see
 * src/crawler/adapters/tbtc.ts. Threshold lists the token address in its docs.
 *
 * Supply is the token's total supply, read on-chain. The price comes from Chainlink's TBTC / USD
 * feed on Ethereum. The backing is the Arbitrum share of the bitcoin the tBTC Bridge has credited
 * to the TBTCVault on Ethereum.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { TBTC_BACKING_DESCRIPTION, TBTC_VAULT, tbtcBacking } from "../../src/crawler/adapters/tbtc";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "tBTC",
    symbol: "tBTC",
    identifier: {
        address: "0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40",
        system: "arbitrum",
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
        return [await tbtcBacking(this.chain, supply!.circulating!)];
    }
}
