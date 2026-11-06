/** U by United Stables on Tron, see tokens/u. */
import { porBackingShare } from "../../src/crawler/adapters/por_share";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { U_ASSETS, U_POR } from "../../tokens/u";

const details: bcked.asset.Details = {
    name: "United Stables",
    symbol: "U",
    identifier: {
        address: "TFNirp6PbqYE1ZTtWuCMUKJWLNZkoCoeFJ",
        system: "tron",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "united-stables",
    },
    reference: "https://www.u.tech/ecosystem/multichain/",
    tags: ["stablecoin"],
    token: "u",
};

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;
    chain: ChainProxy;

    constructor() {
        this.api = new ApiProxy();
        this.chain = new ChainProxy();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { timestamp, issued } = await this.chain.getSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [{ timestamp, circulating: null, burned: null, total: issued, issued, max: null }];
    }

    async getBacking(lastRecorded: bcked.asset.Backing | null): Promise<bcked.asset.Backing[]> {
        return porBackingShare(U_POR, U_ASSETS, `tron:${details.identifier.address}`, lastRecorded);
    }
}
