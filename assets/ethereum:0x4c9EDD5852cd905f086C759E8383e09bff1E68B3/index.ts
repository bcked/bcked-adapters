/**
 * Ethena USDe (USDe) on Ethereum, issued by Ethena. The address is listed in Ethena's docs
 * (https://docs.ethena.fi/technical-design/key-addresses). USDe on other chains is not tracked
 * separately. The supply is the token's totalSupply on Ethereum.
 *
 * The price is the Chainlink USDe/USD feed. The backing (custodied spot assets and hedging positions)
 * is not recorded: Ethena publishes it on its website and in custodian attestations, whose terms
 * allow personal, non-commercial use only. The icon is generic.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Ethena USDe",
    symbol: "USDe",
    identifier: {
        address: "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "ethena",
    },
    reference: "https://docs.ethena.fi/",
    backing: {
        method: "not-tracked",
        description:
            "Ethena publishes the backing on its website and in custodian attestations, but bcked does not record them yet.",
        reference: "https://docs.ethena.fi/resources/custodian-attestations",
    },
    tags: ["stablecoin"],
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
