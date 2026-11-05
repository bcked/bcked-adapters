/**
 * Kinesis Silver (KAG) on Ethereum, an ERC-20 token issued by KMS Labs. The address is the contract
 * address in the KMS Labs terms and conditions (https://kmslabs.money/kms-labs-tcs/).
 *
 * KMS Labs backs each token 1:1 with native KAG on the Kinesis blockchain, held in segregated
 * wallets. Those wallets and their balance are not published in a source bcked may use, so no
 * backing is recorded here. The silver behind all native KAG is recorded on assets/kinesis:KAG.
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
        issuer: "kms-labs",
    },
    reference: "https://kmslabs.money/",
    backing: {
        method: "not-tracked",
        description:
            "KMS Labs states that each token is backed by native KAG it holds, but does not publish the wallets that hold it.",
        reference: "https://kmslabs.money/kms-labs-tcs/",
    },
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
