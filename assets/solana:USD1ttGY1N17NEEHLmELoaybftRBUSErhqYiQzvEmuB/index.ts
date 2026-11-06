/** Draft for measuring USD1 supply on solana against the USD1 reserves oracle. */
import { AbiCoder, formatUnits } from "ethers";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "USD1",
    symbol: "USD1",
    identifier: { address: "USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB", system: "solana" },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: { issuer: "world-liberty-financial" },
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
        const { timestamp, issued } = await this.chain.getSupply(details.identifier.address, "solana");
        return [{ timestamp, circulating: null, burned: null, total: issued, issued, max: null }];
    }
    async getBacking(): Promise<bcked.asset.Backing[]> {
        const bundle = await this.chain.call<string>("0x691b74146cdba162449012aa32d3cbf5df77d4c4", "function latestBundle() view returns (bytes)", [], "ethereum");
        const [timestamp, reserves] = AbiCoder.defaultAbiCoder().decode(["uint256", "uint256"], bundle) as unknown as [bigint, bigint];
        return [{ timestamp: new Date(Number(timestamp) * 1000).toISOString(), underlying: { "rwa:USD": parseFloat(formatUnits(reserves, 18)) } }];
    }
}
