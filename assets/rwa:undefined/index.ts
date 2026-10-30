/**
 * Reserves whose composition the issuer does not report: lines like Tether's "other investments",
 * one sum of several kinds of assets, or periods where a report only states the total. Counted at
 * their US dollar value. One group for all such cases, so mixed sums do not each get an asset.
 * The id stays rwa:undefined so recorded backing keeps its columns.
 */
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Composition not reported",
    symbol: "UNREPORTED",
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
