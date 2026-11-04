/**
 * Kinesis Gold (KAU) on Ethereum, an ERC-20 token issued by KMS Labs. The address is the contract
 * address in the KMS Labs terms and conditions (https://kmslabs.money/kms-labs-tcs/).
 *
 * KMS Labs backs each token 1:1 with native KAU on the Kinesis blockchain, held in segregated
 * wallets. Those wallets and their balance are not published in a source bcked may use, so no
 * backing is recorded here. The gold behind all native KAU is recorded on assets/kinesis:KAU.
 */
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Kinesis Gold",
    symbol: "KAU",
    identifier: {
        address: "0x14DAB79fD7B7B3f748d434812Fd6a9Aac460EA52",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative", "commodity", "tangible-asset"],
    linkedEntities: {
        issuer: "kms-labs",
    },
    reference: "https://kmslabs.money/",
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
        // No Chainlink price feed for KAU.
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
