import { getTokenBackingShare } from "../../src/crawler/adapters/issuer_backing";
import { circleCirculating, onChainSupply } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "EURC",
    symbol: "EURC",
    identifier: {
        address: "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr",
        system: "solana",
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
            "Circle's monthly attestation reports, for all chains together. EURC on Solana gets the Solana share of the reserves, by circulating supply. Before November 2026 that share is known only for report dates with an archived Circle figure for Solana.",
        reference: "https://www.circle.com/transparency",
        reports: "token",
    },
};

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;

    constructor() {
        this.api = new ApiProxy();
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        // Chainlink's EURC/USD feed on Ethereum. The token has the same price on every chain.
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        // The token's supply on Solana includes tokens Circle has not issued yet ("Tokens Allowed
        // But Not Issued" in its reports). Circulating supply is Circle's own figure for Solana.
        const [issued, circulating] = await Promise.all([
            onChainSupply(details.identifier.address, details.identifier.system),
            circleCirculating("EURC", "SOL"),
        ]);
        return [
            {
                timestamp: toISOString(Date.now()),
                circulating,
                burned: null,
                total: issued,
                issued,
                max: null,
            },
        ];
    }

    async getBacking(lastRecorded: bcked.asset.Backing | null): Promise<bcked.asset.Backing[]> {
        // Circle's reserves cover all chains (see tokens/eurc). EURC on Solana is backed by the
        // Solana share of the circulating supply.
        return getTokenBackingShare(
            "eurc",
            "solana:HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr",
            "Solana",
            lastRecorded
        );
    }
}
