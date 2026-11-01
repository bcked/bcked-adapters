import { toId } from "../../utils/helper";
import { InstanceProxy } from "../../utils/instance_proxy";
import { Chainlink } from "./chainlink";

export class ApiProxy
    extends InstanceProxy<bcked.query.ApiModule>
    implements bcked.query.ApiModule
{
    constructor() {
        super({
            chainlink: Chainlink,
        });
    }

    async getPrices(
        identifiers: bcked.asset.Identifier[]
    ): Promise<Partial<Record<string, bcked.asset.Price>>> {
        let prices: Partial<Record<bcked.asset.Id, bcked.asset.Price>> = {};
        for (const api of this.instances) {
            prices = {
                ...prices,
                ...(await api.getPrices(
                    identifiers.filter((identifier) => !prices[toId(identifier)])
                )),
            };
            if (identifiers.every((identifier) => prices[toId(identifier)])) break; // Stop iterating if all prices are known
        }
        return prices;
    }

    async getPrice(identifier: bcked.asset.Identifier): Promise<bcked.asset.Price | undefined> {
        return (await this.getPrices([identifier]))[toId(identifier)];
    }
}
