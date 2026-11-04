/**
 * PayPal USD (PYUSD) on Arbitrum, issued by Paxos. Paxos lists the address in its docs:
 * https://docs.paxos.com/guides/stablecoin/pyusd/mainnet. PYUSD on Arbitrum backs USDai.
 */
import { getTokenBackingShare } from "../../src/crawler/adapters/issuer_backing";
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "PayPal USD",
    symbol: "PYUSD",
    identifier: {
        address: "0x46850aD61C2B7d64d08c9C754F45254596696984",
        system: "arbitrum",
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
            "Paxos's monthly attestation reports, for all chains together. PYUSD on Arbitrum gets the Arbitrum share of the reserves, by circulating supply.",
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
        // Paxos issues PYUSD on Arbitrum through its own supply controller (address in Paxos's docs).
        // Circulating supply is the token's totalSupply on-chain.
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
        // Paxos's reserves cover all chains (see tokens/pyusd). PYUSD on Arbitrum is backed by the
        // Arbitrum share of the circulating supply.
        return getTokenBackingShare(
            "pyusd",
            "arbitrum:0x46850aD61C2B7d64d08c9C754F45254596696984",
            "Arbitrum",
            lastRecorded
        );
    }
}
