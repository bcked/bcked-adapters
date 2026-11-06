/** TrueUSD (TUSD) on Avalanche, see tokens/tusd. */
import { porBackingShare } from "../../src/crawler/adapters/por_share";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { TUSD_ASSETS, TUSD_POR } from "../../tokens/tusd";

const details: bcked.asset.Details = {
    name: "TrueUSD",
    symbol: "TUSD",
    identifier: {
        address: "0x1C20E891Bab6b1727d14Da358FAe2984Ed9B59EB",
        system: "avalanche",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "techteryx",
    },
    reference: "https://tusd.io/",
    tags: ["stablecoin"],
    token: "tusd",
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
        return porBackingShare(TUSD_POR, TUSD_ASSETS, `${system}:${address}`, lastRecorded);
    }
}
