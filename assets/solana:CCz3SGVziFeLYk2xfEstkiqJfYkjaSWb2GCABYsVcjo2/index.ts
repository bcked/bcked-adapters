/** Superstate Short Duration US Government Securities Fund (USTB) on Solana, see tokens/ustb. */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Superstate Short Duration US Government Securities Fund",
    symbol: "USTB",
    identifier: {
        address: "CCz3SGVziFeLYk2xfEstkiqJfYkjaSWb2GCABYsVcjo2",
        system: "solana",
    },
    assetClasses: ["fund", "derivative"],
    linkedEntities: {
        issuer: "superstate",
    },
    reference: "https://docs.superstate.com/investors/smart-contracts",
    tags: ["real-world-asset"],
    token: "ustb",
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
