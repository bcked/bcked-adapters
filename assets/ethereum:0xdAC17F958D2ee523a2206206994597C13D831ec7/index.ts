import {
    getTokenBackingShare,
    getIssuerCirculating,
} from "../../src/crawler/adapters/issuer_backing";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Tether USD",
    symbol: "USDT",
    identifier: {
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "tether",
    },
    reference: "https://tether.to/en/transparency/",
    tags: ["stablecoin", "real-world-asset"],
    token: "usdt",
    backing: {
        method: "reports",
        description:
            "Tether's quarterly assurance reports, for all chains together. USDT on Ethereum gets the Ethereum share of the reserves, by circulating supply.",
        reference: "https://tether.to/en/transparency/",
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
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { timestamp, issued, burned } = await this.chain.getSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [
            {
                timestamp,
                // Without the tokens held in the issuer's treasury, which are not backed.
                circulating: await getIssuerCirculating(1, "Ethereum"),
                burned: burned ?? null,
                total: burned ? issued - burned : issued,
                issued: issued,
                max: null,
            },
        ];
    }

    async getBacking(lastRecorded: bcked.asset.Backing | null): Promise<bcked.asset.Backing[]> {
        // Tether's reserves cover all chains. They are recorded for the token usdt from the
        // assurance reports (https://tether.to/en/transparency/, see scripts/attestations).
        // USDT on Ethereum is backed by the Ethereum share of the circulating supply.
        return getTokenBackingShare("usdt", 1, "Ethereum", lastRecorded);
    }
}
