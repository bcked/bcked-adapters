/**
 * TRX, the native coin of Tron. The price comes from Chainlink's TRX/USD feed on BNB Chain.
 *
 * The supply is not recorded: TronGrid's Ethereum-compatible JSON-RPC, which bcked reads Tron
 * through, has no call for it. The asset is listed in NO_SUPPLY.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";

const details: bcked.asset.Details = {
    name: "TRX",
    symbol: "TRX",
    identifier: {
        address: "TRX",
        system: "tron",
    },
    assetClasses: ["cryptocurrency"],
    linkedEntities: {},
    reference: "https://tron.network/",
    backing: {
        method: "unbacked",
        description: "TRX is the native coin of its chain and is not backed by other assets.",
        reference: null,
    },
    tags: ["chain-token"],
};

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;

    constructor() {
        this.api = new ApiProxy();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        // Not recorded, see above.
        return [];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
