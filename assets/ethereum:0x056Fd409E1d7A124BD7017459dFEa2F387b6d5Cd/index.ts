/**
 * Gemini dollar (GUSD) on Ethereum, a US dollar stablecoin issued by Gemini Trust Company, LLC
 * (https://www.gemini.com/dollar). The address is listed on that page.
 * The supply is read on-chain. There is no Chainlink feed for GUSD, so no price is recorded. The
 * reserves are reported monthly on the same page, but Gemini's site policy allows personal,
 * non-commercial use only (https://www.gemini.com/legal/cryptopedia-site-policy), so the backing is
 * not recorded yet. The icon is generic until the use of the Gemini dollar logo is agreed with Gemini.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Gemini dollar",
    symbol: "GUSD",
    identifier: {
        address: "0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "gemini",
    },
    reference: "https://www.gemini.com/dollar",
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
