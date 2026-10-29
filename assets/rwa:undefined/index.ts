/**
 * Reserves an issuer reports only as a total, without saying which assets they are, for example
 * Tether's "other investments" or Circle's early fund holdings. Counted at their US dollar value.
 * The id stays rwa:undefined so recorded backing keeps its columns.
 */
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Other reserves (not broken down)",
    symbol: "OTHER",
    identifier: {
        address: "undefined",
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
