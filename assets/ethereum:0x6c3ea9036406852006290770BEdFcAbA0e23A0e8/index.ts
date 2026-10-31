import {
    getTokenBackingShare,
    getIssuerCirculating,
} from "../../src/crawler/adapters/issuer_backing";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "PayPal USD",
    symbol: "PYUSD",
    identifier: {
        address: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "paxos",
    },
    reference: "https://www.paxos.com/pyusd-transparency",
    tags: ["stablecoin", "real-world-asset"],
    token: "pyusd",
    backing: {
        method: "reports",
        description:
            "Paxos's monthly attestation reports, for all chains together. PYUSD on Ethereum gets the Ethereum share of the reserves, by circulating supply.",
        reference: "https://www.paxos.com/pyusd-transparency",
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
        // Paxos issues PYUSD natively on Ethereum. The circulating supply comes from DefiLlama, without
        // tokens in the issuer's treasury.
        const circulating = await getIssuerCirculating(120, "Ethereum");
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
        // Paxos's reserves cover all chains (see tokens/pyusd). PYUSD on Ethereum is backed by the
        // Ethereum share of the circulating supply.
        return getTokenBackingShare("pyusd", 120, "Ethereum", lastRecorded);
    }
}
