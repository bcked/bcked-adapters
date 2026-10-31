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
        address: "0xe343167631d89B6Ffc58B88d6b7fB0228795491D",
        system: "ink",
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
            "Paxos's monthly attestation reports, for all chains together. USDG on Ink gets the Ink share of the reserves, by circulating supply.",
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
        // Paxos issues USDG natively on Ink. The circulating supply comes from DefiLlama, without
        // tokens in the issuer's treasury.
        const circulating = await getIssuerCirculating(286, "Ink");
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
        // Paxos's reserves cover all chains (see tokens/usdg). USDG on Ink is backed by the
        // Ink share of the circulating supply.
        return getTokenBackingShare("usdg", 286, "Ink", lastRecorded);
    }
}
