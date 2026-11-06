/** Lombard Staked BTC (LBTC) on Ethereum, see tokens/lbtc. */
import { formatUnits } from "ethers";
import { multicall } from "../../src/crawler/chains/multicall";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Lombard Staked BTC",
    symbol: "LBTC",
    identifier: {
        address: "0x8236a87084f8B84306f72007F36F2618A5634494",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "lombard",
    },
    reference: "https://docs.lombard.finance/learn/transparency/smart-contracts",
    tags: ["wrapped-token", "staking-token"],
    token: "lbtc",
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
        const [round] = await multicall(this.chain, "ethereum", [{ target: "0x70c158c7731Da2C14BC84aEBa39A4FF703DDc7d2", signature: "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)" }]);
        const [, answer] = round! as unknown as [bigint, bigint];
        return [{ timestamp: new Date().toISOString(), underlying: { "bitcoin:BTC": parseFloat(formatUnits(answer, 8)) } }];
    }
}
