/**
 * Spiko US T-Bills Money Market Fund (USTBL) on Base, tokenized fund shares. Spiko lists the token
 * address in its contracts repository: https://github.com/spiko-tech/contracts/blob/main/.cache-8453.json
 *
 * Supply is the token's totalSupply, read on-chain. The price is the fund's net asset value per share
 * from the Chainlink USTBL NAV feed on Ethereum. The fund's holdings are not recorded, see tokens/ustbl.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Spiko US T-Bills Money Market Fund",
    symbol: "USTBL",
    identifier: {
        address: "0xe4880249745eAc5F1eD9d8F7DF844792D560e750",
        system: "base",
    },
    assetClasses: ["fund", "derivative"],
    linkedEntities: {
        issuer: "spiko",
    },
    reference: "https://github.com/spiko-tech/contracts/blob/main/.cache-8453.json",
    tags: ["real-world-asset"],
    token: "ustbl",
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
