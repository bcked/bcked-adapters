import {
    getIssuerBackingShare,
    getIssuerCirculating,
} from "../../src/crawler/adapters/issuer_backing";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "USD Coin",
    symbol: "USDC",
    identifier: {
        address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        system: "polygon",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "circle",
    },
    reference: "https://www.circle.com/transparency",
    tags: ["stablecoin", "real-world-asset"],
    backing: {
        method: "reports",
        description:
            "Circle's monthly attestation reports, for all chains together. USDC on Polygon gets the Polygon share of the reserves, by circulating supply.",
        reference: "https://www.circle.com/transparency",
        reports: "issuer",
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
        // Circle issues USDC natively on Polygon. The circulating supply comes from DefiLlama, without
        // tokens in the issuer's treasury.
        const circulating = await getIssuerCirculating(2, "Polygon");
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
        // Circle's reserves cover all chains (see entities/circle). USDC on Polygon is backed by the
        // Polygon share of the circulating supply.
        return getIssuerBackingShare("circle", 2, "Polygon", lastRecorded);
    }
}
