/**
 * Reserves that bcked has not traced yet: the issuer or protocol discloses them, but bcked does not
 * read them yet, e.g. positions of a protocol on chains bcked does not cover, or tokens bcked does not
 * track. Counted at their US dollar value. Reserves whose composition the issuer does not report
 * are rwa:undefined.
 */
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Not traced yet",
    symbol: "UNTRACKED",
    identifier: {
        address: "UNTRACKED",
        system: "rwa",
    },
    assetClasses: [],
    linkedEntities: {},
    reference: null,
    tags: [],
};

export default class Adapter implements bcked.asset.Adapter {
    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        return [
            {
                timestamp: toISOString(new Date(0)), // Set 1970-01-01 as date.
                usd: 1.0, // Assume a fixed price of $1.0.
            },
        ];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        return [];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
