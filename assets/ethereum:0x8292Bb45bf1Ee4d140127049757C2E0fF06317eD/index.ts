/**
 * Ripple USD (RLUSD) on Ethereum, issued by Standard Custody & Trust, a subsidiary of Ripple. Its reserves are
 * reported monthly (https://ripple.com/products/stablecoin/transparency/), but Ripple's terms do not
 * allow automated collection (https://ripple.com/terms-of-use/), so the backing is not recorded yet.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Ripple USD",
    symbol: "RLUSD",
    identifier: {
        address: "0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "ripple",
    },
    reference: "https://ripple.com/products/stablecoin/transparency/",
    tags: ["stablecoin", "real-world-asset"],
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

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
