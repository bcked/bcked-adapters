/** Draft for measuring cbBTC supply on base against the cbBTC Proof of Reserves. */
import { formatUnits } from "ethers";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { multicall } from "../../src/crawler/chains/multicall";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const CBBTC_POR = "0xcBe87Dc0Cf9d807848a3E703B01A90B28eCFb2a7";

const details: bcked.asset.Details = {
    name: "Coinbase Wrapped BTC",
    symbol: "cbBTC",
    identifier: { address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", system: "base" },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: { issuer: "coinbase" },
    reference: null,
    tags: ["wrapped-token"],
};

export default class Adapter implements bcked.asset.Adapter {
    api = new ApiProxy();
    chain = new ChainProxy();
    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }
    async getPrice(): Promise<bcked.asset.Price[]> {
        return [];
    }
    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { timestamp, issued } = await this.chain.getSupply(details.identifier.address, "base");
        return [{ timestamp, circulating: null, burned: null, total: issued, issued, max: null }];
    }
    async getBacking(): Promise<bcked.asset.Backing[]> {
        const [round] = await multicall(this.chain, "ethereum", [
            {
                target: CBBTC_POR,
                signature:
                    "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
            },
        ]);
        const [, answer, , updatedAt] = round! as unknown as [bigint, bigint, bigint, bigint];
        return [{ timestamp: toISOString(Number(updatedAt) * 1000), underlying: { "bitcoin:BTC": parseFloat(formatUnits(answer, 8)) } }];
    }
}
