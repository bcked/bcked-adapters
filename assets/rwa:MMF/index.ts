/**
 * Shares in money market funds, as reported in reserves. Counted at their US dollar value.
 * Reserve reports state these in US dollars, so the price is fixed at $1 per recorded dollar.
 */
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Money Market Funds",
    symbol: "MMF",
    identifier: {
        address: "MMF",
        system: "rwa",
    },
    assetClasses: ["fund", "cash-equivalent"],
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
