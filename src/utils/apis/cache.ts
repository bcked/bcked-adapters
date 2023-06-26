/**
 * Provides an interface to the Price Cache.
 */

import * as _ from "lodash";
import { getCachedPrice } from "../cache";
import { toId } from "../helper";

export class Cache implements bcked.query.ApiModule {
    async getPrices(
        identifiers: bcked.asset.Identifier[]
    ): Promise<Record<bcked.asset.Id, bcked.asset.Price>> {
        const prices = await Promise.all(
            identifiers.map(async (identifier) => ({
                [toId(identifier)]: await getCachedPrice(identifier),
            }))
        );

        return _.merge({}, ...prices);
    }

    async getPrice(identifier: bcked.asset.Identifier): Promise<bcked.asset.Price | undefined> {
        return (await this.getPrices([identifier]))[toId(identifier)];
    }
}
