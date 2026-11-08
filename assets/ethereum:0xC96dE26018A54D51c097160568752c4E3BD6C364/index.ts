/** Ignition FBTC on Ethereum, see tokens/fbtc. */
import { porBackingShare } from "../../src/crawler/adapters/por_share";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { FBTC_ASSETS, FBTC_POR } from "../../tokens/fbtc";

const details: bcked.asset.Details = {
    name: "Ignition FBTC",
    symbol: "FBTC",
    identifier: {
        address: "0xC96dE26018A54D51c097160568752c4E3BD6C364",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "ignition",
    },
    reference: "https://docs.fbtc.com/",
    tags: ["wrapped-token"],
    token: "fbtc",
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
        const { address, system } = details.identifier;
        return porBackingShare(FBTC_POR, FBTC_ASSETS, `${system}:${address}`, lastRecorded);
    }
}
