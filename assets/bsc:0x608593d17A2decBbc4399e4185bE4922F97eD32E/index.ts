/** USDY on BNB Chain, see tokens/usdy. */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { usdyPrice } from "../../src/crawler/adapters/usdy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Ondo US Dollar Yield",
    symbol: "USDY",
    identifier: {
        address: "0x608593d17A2decBbc4399e4185bE4922F97eD32E",
        system: "bsc",
    },
    assetClasses: ["fund", "derivative"],
    linkedEntities: {
        issuer: "ondo",
    },
    reference: "https://docs.ondo.finance/addresses",
    tags: ["real-world-asset"],
    token: "usdy",
};

export default class Adapter implements bcked.asset.Adapter {
    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        return usdyPrice();
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const circulating = await onChainSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [
            {
                timestamp: toISOString(Date.now()),
                circulating,
                burned: null,
                total: null,
                issued: null,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
