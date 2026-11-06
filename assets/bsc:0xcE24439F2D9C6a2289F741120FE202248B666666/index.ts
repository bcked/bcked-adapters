/** Draft for measuring U supply on bsc against the U Proof of Reserves. */
import { formatUnits } from "ethers";
import { multicall } from "../../src/crawler/chains/multicall";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "United Stables",
    symbol: "U",
    identifier: { address: "0xcE24439F2D9C6a2289F741120FE202248B666666", system: "bsc" },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: { issuer: "united-stables" },
    reference: null,
    tags: ["stablecoin"],
};

export default class Adapter implements bcked.asset.Adapter {
    chain = new ChainProxy();
    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }
    async getPrice(): Promise<bcked.asset.Price[]> {
        return [];
    }
    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { timestamp, issued } = await this.chain.getSupply(details.identifier.address, "bsc");
        return [{ timestamp, circulating: null, burned: null, total: issued, issued, max: null }];
    }
    async getBacking(): Promise<bcked.asset.Backing[]> {
        const [round] = await multicall(this.chain, "bsc", [
            { target: "0xFa8e834DD2200923C706e6438d9030dB029B0c18", signature: "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)" },
        ]);
        const [, answer, , updatedAt] = round! as unknown as [bigint, bigint, bigint, bigint];
        return [{ timestamp: toISOString(Number(updatedAt) * 1000), underlying: { "rwa:USD": parseFloat(formatUnits(answer, 18)) } }];
    }
}
