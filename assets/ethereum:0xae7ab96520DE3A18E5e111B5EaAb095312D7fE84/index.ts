/**
 * stETH rebases: one stETH is one ETH pooled in Lido (staked in validators or buffered in the
 * contract), by Lido's own accounting, which its oracles update daily. The total supply of stETH is
 * therefore the pooled ETH (getTotalPooledEther equals totalSupply), read from the contract.
 * The backing ratio shows the market price of stETH against the ETH it stands for.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Lido Staked Ether",
    symbol: "stETH",
    identifier: {
        address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "lido",
    },
    reference: "https://lido.fi/ethereum",
    tags: ["staking-token"],
    backing: {
        method: "on-chain",
        description:
            "ETH pooled in Lido, read from the stETH contract. One stETH stands for one pooled ETH, by Lido's accounting that its oracles update daily.",
        reference: "https://docs.lido.fi/contracts/lido",
        address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
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
        return [
            {
                timestamp,
                circulating: null,
                burned: null,
                total: issued,
                issued,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        // The total supply of stETH equals the ETH pooled in Lido.
        const { timestamp, issued } = await this.chain.getSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [{ timestamp, underlying: { "ethereum:ETH": issued } }];
    }
}
