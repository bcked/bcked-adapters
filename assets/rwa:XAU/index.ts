import { ApiProxy } from "../../src/crawler/apis/proxy";

const details: bcked.asset.Details = {
    name: "Gold",
    symbol: "XAU", // XAU is the symbol used to represent gold in the forex market. It is derived from the chemical symbol for gold, which is Au.
    identifier: {
        address: "XAU",
        system: "rwa",
    },
    assetClasses: ["commodity", "tangible-asset"],
    linkedEntities: {},
    reference: null,
    tags: [],
};

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;

    constructor() {
        this.api = new ApiProxy();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    /**
     * Gold price in USD/t.oz (troy ounce)
     */
    async getPrice(): Promise<bcked.asset.Price[]> {
        // Chainlink's XAU/USD feed, USD per troy ounce.
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    /**
     * Source: https://www.usgs.gov/centers/national-minerals-information-center/gold-statistics-and-information
     *
     *      t.oz/ton = 1 / (480 grain * 64.79891 milligrams) / 1000 / 1000 / 1000
     * It is assumed that around 0.02% of supply is unrecoverable lost.
     *
     *  	conv = lambda x: x / ((480 * 64.79891) / 1000 / 1000 / 1000)
     *      comp = lambda w: f",{0.02*conv(w)},{0.98*conv(w)},{conv(w)},"
     */
    /**
     * The published records end in 2018. Later years need a source whose terms allow republishing,
     * e.g. USGS mine production added to the 2018 stock.
     */
    async getSupply(): Promise<bcked.asset.Supply[]> {
        return []; // Look up manually and enter in records
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        // There is no backing for Gold
        return [];
    }
}
