import {
    getTokenBackingShare,
    getIssuerCirculating,
} from "../../src/crawler/adapters/issuer_backing";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Global Dollar",
    symbol: "USDG",
    identifier: {
        address: "0x4ae46a509F6b1D9056937BA4500cb143933D2dc8",
        system: "xlayer",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "paxos",
    },
    reference: "https://www.paxos.com/usdg-transparency",
    tags: ["stablecoin", "real-world-asset"],
    token: "usdg",
    backing: {
        method: "reports",
        description:
            "Paxos's monthly attestation reports, for all chains together. USDG on X Layer gets the X Layer share of the reserves, by circulating supply.",
        reference: "https://www.paxos.com/usdg-transparency",
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
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        // Paxos issues USDG natively on X Layer. The circulating supply comes from DefiLlama, without
        // tokens in the issuer's treasury.
        const circulating = await getIssuerCirculating(286, "X Layer");
        if (circulating === null) return [];
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
        // Paxos's reserves cover all chains (see tokens/usdg). USDG on X Layer is backed by the
        // X Layer share of the circulating supply.
        return getTokenBackingShare("usdg", 286, "X Layer", lastRecorded);
    }
}
