/**
 * Kinesis Silver (KAG), the native coin of the Kinesis KAG network. One KAG stands for one troy ounce
 * of silver held in allocated storage.
 *
 * The supply on the Kinesis ledger is not recorded: the ledger is read through the Horizon API that
 * Kinesis runs, and the Kinesis terms of use (https://kinesis.money/about-us/documents/terms-of-use/)
 * do not allow reusing its data without permission. The asset is listed in NO_SUPPLY.
 *
 * The backing is the silver in Chainlink's KAG Proof of Reserves feed on Ethereum
 * (https://data.chain.link/feeds/ethereum/mainnet/kag-por), in troy ounces.
 *
 * There is no Chainlink price feed for KAG and no on-chain pool with enough liquidity, so KAG has
 * no price.
 */
import { formatUnits } from "ethers";
import { multicall } from "../../src/crawler/chains/multicall";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

export const KAG_POR = "0x3F0543aA057BcAeA152Fe9462Cb3ffaB305a6F8D";

const details: bcked.asset.Details = {
    name: "Kinesis Silver",
    symbol: "KAG",
    identifier: {
        address: "KAG",
        system: "kinesis",
    },
    assetClasses: ["cryptocurrency", "derivative", "commodity", "tangible-asset"],
    linkedEntities: {
        issuer: "kinesis",
    },
    reference: "https://kinesis.money/silver/",
    tags: ["real-world-asset"],
    backing: {
        method: "custodian",
        description:
            "The silver behind KAG in troy ounces, from Chainlink's KAG Proof of Reserves feed on Ethereum. Updated daily. The supply of KAG and its price are not recorded, so there is no backing ratio.",
        reference: "https://data.chain.link/feeds/ethereum/mainnet/kag-por",
    },
};

export default class Adapter implements bcked.asset.Adapter {
    chain: ChainProxy;

    constructor() {
        this.chain = new ChainProxy();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        // No Chainlink feed and no on-chain pool with enough liquidity.
        return [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        // Not recorded, see above.
        return [];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        // Silver in troy ounces, from Chainlink's KAG Proof of Reserves feed on-chain.
        const [round] = await multicall(this.chain, "ethereum", [
            {
                target: KAG_POR,
                signature:
                    "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
            },
        ]);
        const [, answer, , updatedAt] = round! as unknown as [bigint, bigint, bigint, bigint];
        return [
            {
                timestamp: toISOString(Number(updatedAt) * 1000),
                underlying: { "rwa:XAG": parseFloat(formatUnits(answer, 18)) },
            },
        ];
    }
}
