/**
 * Treasury Auctions can be looked up here: https://www.treasurydirect.gov/auctions/auction-query/
 */
import { toISOString } from "../../src/utils/primitive/string_formatting";

const details: bcked.asset.Details = {
    name: "U.S. Treasury Bills",
    symbol: "USTB",
    identifier: {
        address: "USTB",
        system: "rwa",
    },
    assetClasses: ["fixed-income-security", "cash-equivalent"],
    linkedEntities: { issuer: "usdt" }, // United States Department of the Treasury
    reference: null,
    tags: [],
};

export default class Adapter implements bcked.asset.Adapter {
    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price | null> {
        return {
            timestamp: toISOString(new Date(0)), // Set 1970-01-01 as date.
            usd: 1.0, // Assume a fixed price of $1.0.
        };
    }

    async getSupply(): Promise<bcked.asset.Supply | null> {
        return null;
    }

    async getBacking(): Promise<bcked.asset.Backing | null> {
        return null;
    }
}
