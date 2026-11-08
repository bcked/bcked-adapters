import { getTokenBackingShare } from "../../src/crawler/adapters/issuer_backing";
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "USD Coin",
    symbol: "USDC",
    identifier: {
        address: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
        system: "monad",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "circle",
    },
    reference: "https://www.circle.com/transparency",
    tags: ["stablecoin", "real-world-asset"],
    token: "usdc",
    backing: {
        method: "reports",
        description:
            "Circle's monthly attestation reports, for all chains together. USDC on Monad gets the Monad share of the reserves, by circulating supply.",
        reference: "https://www.circle.com/transparency",
        reports: "token",
    },
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
        // Circle issues USDC natively on Monad. Circulating supply is the token's totalSupply on-chain:
        // the issuer mints on demand and holds no unissued tokens.
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

    async getBacking(lastRecorded: bcked.asset.Backing | null): Promise<bcked.asset.Backing[]> {
        // Circle's reserves cover all chains (see tokens/usdc). USDC on Monad is backed by the
        // Monad share of the circulating supply.
        return getTokenBackingShare(
            "usdc",
            "monad:0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
            "Monad",
            lastRecorded
        );
    }
}
