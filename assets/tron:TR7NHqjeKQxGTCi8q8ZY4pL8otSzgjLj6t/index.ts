import {
    getTokenBackingShare,
    getIssuerCirculating,
} from "../../src/crawler/adapters/issuer_backing";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Tether USD",
    symbol: "USDT",
    identifier: {
        address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        system: "tron",
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
            "Tether's quarterly assurance reports, for all chains together. USDT on Tron gets the Tron share of the reserves, by circulating supply.",
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
        // Tether issues USDT natively on Tron. The circulating supply comes from DefiLlama, without
        // tokens in the issuer's treasury.
        const circulating = await getIssuerCirculating(1, "Tron");
        if (circulating === null) return [];
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
        // Tether's reserves cover all chains (see tokens/usdt). USDT on Tron is backed by the
        // Tron share of the circulating supply.
        return getTokenBackingShare("usdt", 1, "Tron", lastRecorded);
    }
}
