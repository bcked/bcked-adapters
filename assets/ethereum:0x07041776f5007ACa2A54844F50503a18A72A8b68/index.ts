/**
 * USA₮ (USAT) on Ethereum, a US dollar stablecoin issued by Anchorage Digital Bank, N.A. and
 * brought to market with Tether (https://www.anchorage.com/usat-policies-disclosures). The address
 * is listed in Anchorage Digital's stablecoin documentation
 * (https://docs.anchorage.com/knowledge-base/platform/users/stablecoins).
 * The supply is read on-chain. There is no Chainlink feed for USAT, so no price is recorded. The
 * reserves are reported monthly (https://www.anchorage.com/platform/usat-reserve-attestations), but
 * Anchorage Digital's terms do not allow automated collection
 * (https://www.anchorage.com/terms-and-conditions), so the backing is not recorded yet. USAT on Celo
 * is not tracked yet. The icon is generic until the use of the USAT logo is agreed with Tether.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "USA₮",
    symbol: "USAT",
    identifier: {
        address: "0x07041776f5007ACa2A54844F50503a18A72A8b68",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "anchorage",
    },
    reference: "https://www.anchorage.com/usat-policies-disclosures",
    backing: {
        method: "not-tracked",
        description:
            "Anchorage Digital publishes monthly reserve reports, but bcked does not record them yet.",
        reference: "https://www.anchorage.com/platform/usat-reserve-attestations",
    },
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
