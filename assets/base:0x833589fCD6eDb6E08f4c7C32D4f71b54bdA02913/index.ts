import { getTokenBackingShare } from "../../src/crawler/adapters/issuer_backing";
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "USD Coin",
    symbol: "USDC",
    identifier: {
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        system: "base",
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
            "Circle's monthly attestation reports, for all chains together. USDC on Base gets the Base share of the reserves, by circulating supply.",
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
        // Circle issues USDC natively on Base. Circulating supply is the token's totalSupply on-chain:
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
        // Circle's reserves cover all chains (see tokens/usdc). USDC on Base is backed by the
        // Base share of the circulating supply.
        return getTokenBackingShare(
            "usdc",
            "base:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            "Base",
            lastRecorded
        );
    }
}
