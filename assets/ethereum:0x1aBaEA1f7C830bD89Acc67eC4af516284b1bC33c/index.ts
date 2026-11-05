import { getTokenBackingShare } from "../../src/crawler/adapters/issuer_backing";
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "EURC",
    symbol: "EURC",
    identifier: {
        address: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "circle",
    },
    reference: "https://www.circle.com/eurc",
    tags: ["stablecoin", "real-world-asset"],
    token: "eurc",
    backing: {
        method: "reports",
        description:
            "Circle's monthly attestation reports, for all chains together. EURC on Ethereum gets the Ethereum share of the reserves, by circulating supply.",
        reference: "https://www.circle.com/transparency",
        reports: "token",
    },
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
        // Chainlink's EURC/USD feed on Ethereum.
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        // Circle issues EURC natively on Ethereum and mints on demand. Circulating supply is the
        // token's totalSupply on-chain.
        const { timestamp, issued, burned } = await this.chain.getSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [
            {
                timestamp,
                circulating: await onChainSupply(
                    details.identifier.address,
                    details.identifier.system
                ),
                burned: burned ?? null,
                total: burned ? issued - burned : issued,
                issued: issued,
                max: null,
            },
        ];
    }

    async getBacking(lastRecorded: bcked.asset.Backing | null): Promise<bcked.asset.Backing[]> {
        // Circle's reserves cover all chains (see tokens/eurc). EURC on Ethereum is backed by the
        // Ethereum share of the circulating supply.
        return getTokenBackingShare(
            "eurc",
            "ethereum:0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
            "Ethereum",
            lastRecorded
        );
    }
}
