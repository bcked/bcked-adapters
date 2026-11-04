/**
 * Kinesis Silver (KAG) on Ethereum. Kinesis lists this contract for KAG on Ethereum in its explorer
 * (https://explorer.kinesis.money/). The silver in Chainlink's KAG Proof of Reserves feed is recorded
 * on the native coin (assets/kinesis:KAG). How KAG on Ethereum relates to the coins on the Kinesis
 * ledger is not published in a source bcked reads, so no backing is recorded for it here.
 */
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Kinesis Silver",
    symbol: "KAG",
    identifier: {
        address: "0x56Ba8B58B7d1f6d384A1C4dD553F39ebc8741B8e",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative", "commodity", "tangible-asset"],
    linkedEntities: {
        issuer: "kinesis",
    },
    reference: "https://kinesis.money/silver/",
    tags: ["real-world-asset"],
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
        const { timestamp, issued, burned } = await this.chain.getSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [
            {
                timestamp,
                circulating: null,
                burned: burned ?? null,
                total: burned ? issued - burned : issued,
                issued,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
