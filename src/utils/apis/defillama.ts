/**
 * Provides an interface to the DefiLlama API.
 * All attribution goes to the DefiLlama API.
 * API documentation: https://defillama.com/docs/api
 */

import * as _ from "lodash";
import { toId } from "../helper";
import { JsonApi } from "../primitive/json_api";
import { urlLengthGrouping } from "../primitive/requests";
import { toISOString } from "../primitive/string_formatting";

interface Coin {
    decimals: number;
    symbol: string;
    price: number;
    timestamp: number;
    confidence: number;
}

export class DefiLlama implements bcked.query.ApiModule {
    api: JsonApi;

    constructor() {
        this.api = new JsonApi("https://coins.llama.fi");
    }

    private getPriceRoute(tokens: string, searchWidth: string = "4h") {
        return `/prices/current/${tokens}?searchWidth=${searchWidth}`;
    }

    private async _getPrices(
        identifiers: bcked.asset.Identifier[]
    ): Promise<Record<bcked.asset.Id, bcked.asset.Price | null>> {
        const keyToId = Object.fromEntries(
            identifiers.map((identifier) => [
                `${identifier.system}:${identifier.address}`,
                toId(identifier),
            ])
        );

        const priceRoute = this.getPriceRoute(Object.keys(keyToId).join(","));
        const response = await this.api.fetchJson<{ coins: Record<string, Coin> }>(priceRoute);
        const coins = response.coins;

        return Object.fromEntries(
            Object.entries(keyToId)
                .map(([key, id]): [bcked.asset.Id, Coin | undefined] => [id, coins[key]])
                .map(([id, coin]): [bcked.asset.Id, bcked.asset.Price | null] => [
                    id,
                    coin
                        ? {
                              timestamp: toISOString(
                                  coin.timestamp > 1775369079 ? coin.timestamp : Date.now() // If default date, take the current one.
                              ),
                              usd: coin.price,
                          }
                        : null,
                ])
        );
    }

    async getPrices(
        identifiers: bcked.asset.Identifier[]
    ): Promise<Record<bcked.asset.Id, bcked.asset.Price>> {
        const groups = urlLengthGrouping(identifiers, this.api.baseURL, (group) =>
            this.getPriceRoute(
                group.map((identifier) => `${identifier.system}:${identifier.address}`).join(",")
            )
        );

        const prices = await Promise.all(groups.map((group) => this._getPrices(group)));

        return _.merge({}, ...prices);
    }

    async getPrice(identifier: bcked.asset.Identifier): Promise<bcked.asset.Price | undefined> {
        return (await this.getPrices([identifier]))[toId(identifier)];
    }
}
