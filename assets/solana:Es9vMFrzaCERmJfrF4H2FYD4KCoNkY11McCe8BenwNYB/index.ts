import { getTokenBackingShare } from "../../src/crawler/adapters/issuer_backing";
import { tetherCirculating } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Tether USD",
    symbol: "USDT",
    identifier: {
        address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        system: "solana",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "tether",
    },
    reference: "https://tether.to/en/transparency/",
    tags: ["stablecoin", "real-world-asset"],
    token: "usdt",
    backing: {
        method: "reports",
        description:
            "Tether's quarterly assurance reports, for all chains together. USDT on Solana gets the Solana share of the reserves, by circulating supply.",
        reference: "https://tether.to/en/transparency/",
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
        // Tether issues USDT natively on Solana. Circulating supply from Tether's per-chain figures,
        // without the tokens in its treasury.
        const circulating = await tetherCirculating("usdt", "sol");
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
        // Tether's reserves cover all chains (see tokens/usdt). USDT on Solana is backed by the
        // Solana share of the circulating supply.
        return getTokenBackingShare(
            "usdt",
            "solana:Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            "Solana",
            lastRecorded
        );
    }
}
