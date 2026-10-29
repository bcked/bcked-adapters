import { ForexData } from "../../src/crawler/apis/forex_data";

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
    api: ForexData;

    constructor() {
        this.api = new ForexData();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    /**
     * Gold price in USD/t.oz (troy ounce)
     */
    async getPrice(): Promise<bcked.asset.Price[]> {
        return [await this.api.getPrice(details.identifier)];
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
     * From 2019 the records use the above-ground stock of the World Gold Council
     * (https://www.gold.org/goldhub/data/how-much-gold): 197,576 t (end of 2019), 201,296 t (2020),
     * 205,238 t (2021), 208,874 t (2022), 212,582 t (2023), 216,265 t (2024), 222,600 t (end of Q2 2026).
     * Its estimate is about 4% higher than the USGS based values above, so the series steps up in 2019.
     */
    async getSupply(): Promise<bcked.asset.Supply[]> {
        return []; // Look up manually and enter in records
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        // There is no backing for Gold
        return [];
    }
}
