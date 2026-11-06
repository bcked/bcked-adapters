/**
 * Staked USDe (sUSDe) on Ethereum, issued by Ethena. The contract is a vault that holds USDe, and its
 * tokens grow in value as staking rewards are added. The address is listed in Ethena's docs
 * (https://docs.ethena.fi/technical-design/key-addresses). sUSDe on other chains is not tracked
 * separately.
 *
 * The backing is the USDe held by the sUSDe contract, read on-chain. It includes rewards that are
 * still vesting, which the contract already holds. The price is the Chainlink sUSDe/USD feed.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const USDE = "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3";

const details: bcked.asset.Details = {
    name: "Ethena Staked USDe",
    symbol: "sUSDe",
    identifier: {
        address: "0x9D39A5DE30e57443BfF2A8307A4256c8797A3497",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "ethena",
    },
    reference: "https://docs.ethena.fi/technical-design/key-addresses",
    tags: ["staking-token"],
    backing: {
        method: "on-chain",
        description: "USDe held by the sUSDe contract, read from the USDe contract.",
        reference: "https://docs.ethena.fi/technical-design/key-addresses",
        address: "0x9D39A5DE30e57443BfF2A8307A4256c8797A3497",
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
            USDE,
            details.identifier.system
        );
        return [{ timestamp, underlying: { [`ethereum:${USDE}`]: balance } }];
    }
}
