/**
 * Provides an interface to the Dexscreener API.
 * All attribution goes to the Dexscreener API.
 * API documentation: https://docs.dexscreener.com/api/reference
 */

import _ from "lodash";
import { toId } from "../helper";
import { groupWhile } from "../primitive/array";
import { median } from "../primitive/math";
import { JsonApi } from "../primitive/requests";
import { toISOString } from "../primitive/string_formatting";

const URL_MAX_LENGTH = 2048;
const FETCH_MAX_COUNT = 30;

interface Pair {
    chainId: string;
    priceUsd: number;
    baseToken: {
        address: string;
    };
}

export class Dexscreener implements bcked.query.ApiModule {
    api: JsonApi;

    constructor() {
        this.api = new JsonApi("https://api.dexscreener.com");
    }

    private getPriceRoute(tokens: string) {
        return `/latest/dex/tokens/${tokens}`;
    }

    private async _getPrices(
        identifiers: bcked.asset.Identifier[]
    ): Promise<Record<bcked.asset.Id, bcked.asset.Price>> {
        const keyToContracts = Object.fromEntries(
            identifiers.map((identifier) => [
                `${identifier.system}:${identifier.address}`,
                identifier,
            ])
        );

        const priceRoute = this.getPriceRoute(Object.keys(keyToContracts).join(","));
        const response = await this.api.fetchJson<{ pairs: Pair[] | null }>(priceRoute);
        const pairs = response.pairs ?? [];

        const tokenPairs = pairs.filter((pair) => pair.baseToken.address in keyToContracts);
        const pairsPerToken = _.groupBy(tokenPairs, "baseToken.address");
        const pricePerToken = Object.fromEntries(
            Object.entries(pairsPerToken)
                .map(([address, pairs]): [bcked.asset.Id, string, Pair[]] => [
                    toId(keyToContracts[address]!),
                    keyToContracts[address]!.system,
                    pairs,
                ])
                .map(([id, chain, pairs]): [bcked.asset.Id, Pair[]] => [
                    id,
                    pairs.filter((pair) => pair.chainId == chain),
                ])
                .map(([id, pairs]): [bcked.asset.Id, bcked.asset.Price] => [
                    id,
                    {
                        timestamp: toISOString(Date.now()),
                        usd: median(_.map(pairs, "priceUsd"))!,
                    },
                ])
        );

        return pricePerToken;
    }

    async getPrices(
        identifiers: bcked.asset.Identifier[]
    ): Promise<Record<string, bcked.asset.Price>> {
        const groups = groupWhile(
            identifiers,
            (group) =>
                (this.api.baseURL + this.getPriceRoute(_.map(group, "token.address").join(",")))
                    .length <= URL_MAX_LENGTH && group.length <= FETCH_MAX_COUNT
        );

        const prices = await Promise.all(groups.map((group) => this._getPrices(group)));

        return _.merge({}, ...prices);
    }

    async getPrice(identifier: bcked.asset.Identifier): Promise<bcked.asset.Price | undefined> {
        return (await this.getPrices([identifier]))[toId(identifier)];
    }
}
