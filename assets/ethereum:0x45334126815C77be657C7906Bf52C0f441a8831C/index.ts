/**
 * AZ Gold Reserve (AZG) on Ethereum, a token of [Arizore](https://arizore.io/) that is described as
 * backed by gold reserves: bullion, in-ground resources and tailings pledged to the AZ Reserve. The
 * token address is published on the issuer's reserve page (https://arizore.io/reserve-data/azg).
 * The supply is read on-chain. There is no Chainlink feed and no on-chain pool for AZG, so no price
 * is recorded. The reserves are not published in a source whose terms allow automated collection,
 * so the backing is not recorded. The icon is generic: the issuer's terms do not allow using its
 * marks without consent.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "AZ Gold Reserve",
    symbol: "AZG",
    identifier: {
        address: "0x45334126815C77be657C7906Bf52C0f441a8831C",
        system: "ethereum",
    },
    assetClasses: ["derivative", "commodity"],
    linkedEntities: {
        issuer: "arizore",
    },
    reference: "https://arizore.io/reserve-data/azg",
    tags: ["real-world-asset"],
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
