/**
 * Agora Dollar (AUSD) on Ethereum, issued by Agora. Its reserves are reported monthly
 * (https://developer.agora.finance/attestations), but Agora's terms do not allow automated access
 * without consent (https://static.agora.finance/termsofuse.pdf), so the backing is not recorded yet.
 * The icon is generic: Agora's terms do not allow using its logo without consent.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Agora Dollar",
    symbol: "AUSD",
    identifier: {
        address: "0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "agora",
    },
    reference: "https://developer.agora.finance/attestations",
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
