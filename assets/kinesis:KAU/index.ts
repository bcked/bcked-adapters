/**
 * Kinesis Gold (KAU), the native coin of the Kinesis blockchain, issued by Kinesis. One KAU stands for
 * one gram of gold held in allocated storage.
 *
 * The supply on the Kinesis blockchain is not recorded: the ledger is read through the Horizon API
 * that Kinesis runs, and the Kinesis terms of use do not allow reusing its data without permission.
 *
 * The backing is the gold in Chainlink's KAU Proof of Reserves feed on Ethereum
 * (https://data.chain.link/feeds/ethereum/mainnet/kau-por). The feed reports grams, recorded here in
 * troy ounces like all gold (rwa:XAU).
 *
 * There is no Chainlink price feed for KAU, so KAU has no price.
 */
import { formatUnits } from "ethers";
import { multicall } from "../../src/crawler/chains/multicall";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

export const KAU_POR = "0xaB5Dd7DD7669072a1Ef27c0ba241120A27A1aeC3";
/** Grams in one troy ounce. */
export const GRAMS_PER_TROY_OUNCE = 31.1034768;

const details: bcked.asset.Details = {
    name: "Kinesis Gold",
    symbol: "KAU",
    identifier: {
        address: "KAU",
        system: "kinesis",
    },
    assetClasses: ["cryptocurrency", "derivative", "commodity", "tangible-asset"],
    linkedEntities: {
        issuer: "kinesis",
    },
    reference: "https://kinesis.money/gold/",
    tags: ["real-world-asset"],
    backing: {
        method: "custodian",
        description:
            "The gold behind all KAU on the Kinesis blockchain, from Chainlink's KAU Proof of Reserves feed on Ethereum. The feed reports grams, shown here in troy ounces. Updated daily. KAU has no price feed and its supply on the Kinesis blockchain is not recorded, so there is no backing ratio.",
        reference: "https://data.chain.link/feeds/ethereum/mainnet/kau-por",
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
        // No Chainlink price feed for KAU.
        return [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        // No source bcked may use for the supply on the Kinesis blockchain.
        return [];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        // Gold in grams from Chainlink's KAU Proof of Reserves feed on-chain, in troy ounces.
        const [round] = await multicall(this.chain, "ethereum", [
            {
                target: KAU_POR,
                signature:
                    "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
            },
        ]);
        const [, answer, , updatedAt] = round! as unknown as [bigint, bigint, bigint, bigint];
        return [
            {
                timestamp: toISOString(Number(updatedAt) * 1000),
                underlying: {
                    "rwa:XAU": parseFloat(formatUnits(answer, 18)) / GRAMS_PER_TROY_OUNCE,
                },
            },
        ];
    }
}
