/**
 * OpenEden TBILL Vault (TBILL) on Ethereum, tokenized shares of a fund that holds short-dated US
 * Treasury bills. OpenEden lists the vault contract, which is also the token, in its docs:
 * https://docs.openeden.com/tbill/smart-contract-addresses
 *
 * Supply is the token's totalSupply (6 decimals), read on-chain. Tokens in a pending redemption
 * are burned when the redemption is processed, so they still count until then. The price is the
 * fund's net asset value per token from the Chainlink TBILL NAV feed on Ethereum. The fund's
 * holdings are not recorded, see tokens/tbill.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "OpenEden TBILL Vault",
    symbol: "TBILL",
    identifier: {
        address: "0xad6250f0BD49F7a1eB11063af2cE9F25B9597b0F",
        system: "ethereum",
    },
    assetClasses: ["fund", "derivative"],
    linkedEntities: {
        issuer: "openeden",
    },
    reference: "https://docs.openeden.com/tbill/smart-contract-addresses",
    tags: ["real-world-asset"],
    
};

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;

    constructor() {
        this.api = new ApiProxy();
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
        return [];
    }
}
