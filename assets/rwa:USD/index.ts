import { CsvApi, joinOptions } from "../../src/utils/primitive/requests";
import { toISOString } from "../../src/utils/primitive/string_formatting";

const details: bcked.asset.Details = {
    name: "U.S. dollar",
    symbol: "USD",
    identifier: {
        address: "USD",
        system: "rwa",
    },
    assetClasses: ["fiat-money", "cash"],
    linkedEntities: { issuer: "fed" },
    reference: null,
    tags: [],
};

interface Options {
    rel: string;
    series: string;
    lastobs?: number;
    from?: `${number}/${number}/${number}`; // mm/dd/yyyy
    to?: `${number}/${number}/${number}`; // mm/dd/yyyy
    filetype: "csv" | "spreadsheetml" | "sdmx";
    label: "omit" | "include";
    layout: "seriescolumn" | "seriesrow" | "serieslist";
}

interface Supply {
    "Time Period": primitive.ISODateTimeString;
    "M1_N.WM": number;
    "M2_N.WM": number;
    "MCU_N.WM": number;
}

export default class Adapter implements bcked.asset.Adapter {
    api: CsvApi;

    constructor() {
        this.api = new CsvApi("https://www.federalreserve.gov");
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        return [
            {
                timestamp: toISOString(new Date(0)), // The price will always be 1.0. Set 1970-01-01 as date.
                usd: 1.0,
            },
        ];
    }

    private getSupplyUrl(options: Options) {
        return `/datadownload/Output.aspx?${joinOptions(options)}`;
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const url = this.getSupplyUrl({
            rel: "H6",
            series: "f14e8c98effb12bfe9ff8ee15bc760a3",
            lastobs: 1,
            filetype: "csv",
            label: "omit",
            layout: "seriescolumn",
        });

        const supplies = await this.api.fetchCsv<Supply[]>(url, { columns: true, from_line: 2 });
        if (!supplies?.length) return [];

        const supply = supplies[0]!;

        const billion = 1000 * 1000 * 1000;
        return [
            {
                timestamp: toISOString(new Date(supply["Time Period"])),
                burned: null,
                circulating: supply["MCU_N.WM"] * billion,
                total: supply["M2_N.WM"] * billion,
                issued: supply["M2_N.WM"] * billion,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        // There is no backing for USD
        return [];
    }
}
