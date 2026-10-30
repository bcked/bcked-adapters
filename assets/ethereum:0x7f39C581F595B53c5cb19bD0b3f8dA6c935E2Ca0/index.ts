/**
 * Wrapped stETH: stETH that does not rebase. The contract holds stETH and its tokens grow in value
 * instead. The backing is the stETH held by the wstETH contract, read from the stETH contract.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const STETH = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";

const details: bcked.asset.Details = {
    name: "Wrapped stETH",
    symbol: "wstETH",
    identifier: {
        address: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "lido",
    },
    reference: "https://docs.lido.fi/contracts/wsteth",
    tags: ["wrapped-token", "staking-token"],
    backing: {
        method: "on-chain",
        description: "stETH held by the wstETH contract, read from the stETH contract.",
        reference: "https://docs.lido.fi/contracts/wsteth",
        address: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    },
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
        const { timestamp, balance } = await this.chain.getBalance(
            details.identifier.address,
            STETH,
            details.identifier.system
        );
        return [{ timestamp, underlying: { [`ethereum:${STETH}`]: balance } }];
    }
}
