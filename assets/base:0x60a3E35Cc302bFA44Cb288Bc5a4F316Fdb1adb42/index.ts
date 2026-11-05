import { getTokenBackingShare } from "../../src/crawler/adapters/issuer_backing";
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "EURC",
    symbol: "EURC",
    identifier: {
        address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
        system: "base",
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
            "Circle's monthly attestation reports, for all chains together. EURC on Base gets the Base share of the reserves, by circulating supply.",
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
        // Circle issues EURC natively on Base and mints on demand. Circulating supply is the
        // token's totalSupply on-chain.
        const circulating = await onChainSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [
            {
                timestamp: toISOString(Date.now()),
                circulating,
                burned: null,
                total: null,
                issued: null,
                max: null,
            },
        ];
    }

    async getBacking(lastRecorded: bcked.asset.Backing | null): Promise<bcked.asset.Backing[]> {
        // Circle's reserves cover all chains (see tokens/eurc). EURC on Base is backed by the Base
        // share of the circulating supply.
        return getTokenBackingShare(
            "eurc",
            "base:0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
            "Base",
            lastRecorded
        );
    }
}
