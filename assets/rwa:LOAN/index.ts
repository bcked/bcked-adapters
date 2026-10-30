/**
 * Loans backed by collateral, as reported in reserves. Counted at their US dollar value.
 * Reserve reports state these in US dollars, so the price is fixed at $1 per recorded dollar.
 */
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Secured Loans",
    symbol: "LOAN",
    identifier: {
        address: "LOAN",
        system: "rwa",
    },
    assetClasses: ["loan"],
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
