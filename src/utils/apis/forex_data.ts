/**
 * Provides an interface to the Swissquote API.
 * All attribution goes to the Swissquote API.
 */
import * as _ from "lodash";
import { JsonApi } from "../primitive/json_api";
import { toISOString } from "../primitive/string_formatting";

interface SpreadProfilePrice {
    spreadProfile: "Prime" | "Standard" | "Premium";
    bidSpread: number;
    askSpread: number;
    bid: number;
    ask: number;
}

interface Topo {
    platform: "MT4" | "MT5" | "AT";
    server: string;
}

interface BestBookQuote {
    topo: Topo;
    spreadProfilePrices: SpreadProfilePrice[];
    ts: number;
}

type BestBookQuotes = BestBookQuote[];

export class ForexData {
    api: JsonApi;

    constructor() {
        this.api = new JsonApi(`https://forex-data-feed.swissquote.com`);
    }

    private getUrl(asset: string): string {
        return `/public-quotes/bboquotes/instrument/${asset}/USD`;
    }

    async getPrice(identifier: bcked.asset.Identifier): Promise<bcked.asset.Price> {
        if (identifier.system != "rwa")
            throw new Error(`Forex data for a non RWA was requested: ${identifier.address}`);

        const url = this.getUrl(identifier.address);
        const quotes = await this.api.fetchJson<BestBookQuotes>(url);
        const quote = _.find(quotes, { topo: { platform: "MT5" } }) as BestBookQuote | undefined;
        if (quote == undefined)
            throw new Error(`No Best Book Quote found for ${identifier.address}.`);
        const spreadProfilePrice = _.find(quote.spreadProfilePrices, { spreadProfile: "Standard" });
        if (spreadProfilePrice == undefined)
            throw new Error(`No Spread Profile Price found for ${identifier.address}.`);

        return {
            timestamp: toISOString(quote.ts),
            usd: spreadProfilePrice.ask,
        };
    }
}
