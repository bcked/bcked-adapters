/**
 * Spiko Amundi Overnight Swap Fund (SAFO, USD class) on Base, tokenized fund shares, see tokens/safo.
 *
 * Supply is the token's totalSupply, read on-chain. The price is the fund's net asset value per share
 * from the Chainlink SAFO NAV feed on Ethereum.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Spiko Amundi Overnight Swap Fund (USD)",
    symbol: "SAFO",
    identifier: {
        address: "0x0BB754d8940e283D9Ff6855ab5dAfBC14165c059",
        system: "base",
    },
    assetClasses: ["fund", "derivative"],
    linkedEntities: {
        issuer: "spiko",
    },
    reference: "https://public-api.spiko.io/v0/share-classes/",
    tags: ["real-world-asset"],
    token: "safo",
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
        // totalSupply of the token, read on-chain. Shares in a pending redemption are burned when
        // the redemption is executed, so they still count until then.
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
