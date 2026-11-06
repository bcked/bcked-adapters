/** Ignition FBTC on Ethereum, see tokens/fbtc. */
import { formatUnits } from "ethers";
import { multicall } from "../../src/crawler/chains/multicall";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Ignition FBTC",
    symbol: "FBTC",
    identifier: {
        address: "0xC96dE26018A54D51c097160568752c4E3BD6C364",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "ignition",
    },
    reference: "https://docs.fbtc.com/",
    tags: ["wrapped-token"],
    token: "fbtc",
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
        const [round] = await multicall(this.chain, "ethereum", [{ target: "0x75A0d3264a949C2C920d7F25Df174af1FaF73399", signature: "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)" }]);
        const [, answer] = round! as unknown as [bigint, bigint];
        return [{ timestamp: new Date().toISOString(), underlying: { "bitcoin:BTC": parseFloat(formatUnits(answer, 8)) } }];
    }
}
