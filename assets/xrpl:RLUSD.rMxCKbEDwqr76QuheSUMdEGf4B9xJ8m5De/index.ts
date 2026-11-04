/**
 * Ripple USD (RLUSD) on the XRP Ledger, issued natively by the account
 * rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De. Ripple lists this issuer and currency in its XRP Ledger
 * account file (https://ripple.com/.well-known/xrp-ledger.toml), and the account's domain on the
 * ledger is ripple.com. Its reserves are reported monthly for all chains together, but Ripple's terms
 * do not allow automated collection (https://ripple.com/terms-of-use/), so the backing is not
 * recorded yet (see tokens/rlusd).
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Ripple USD",
    symbol: "RLUSD",
    identifier: {
        address: "RLUSD.rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
        system: "xrpl",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "ripple",
    },
    reference: "https://ripple.com/products/stablecoin/transparency/",
    tags: ["stablecoin", "real-world-asset"],
    token: "rlusd",
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
        // The issuer's obligations in RLUSD: all RLUSD held on trust lines against the issuer.
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
