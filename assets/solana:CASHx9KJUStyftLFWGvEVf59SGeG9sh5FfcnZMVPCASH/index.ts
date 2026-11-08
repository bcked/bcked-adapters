/**
 * CASH on Solana, a US dollar stablecoin issued by Bridge Building Inc (https://www.bridge.xyz/)
 * through its Open Issuance platform for Phantom (https://phantom.com/). Bridge lists the mint on its
 * transparency page (https://reserves.bridge.xyz/cash). Bridge also lists a CASH contract on HyperEVM,
 * which is not tracked: nearly all CASH is on Solana.
 *
 * The backing comes from Bridge's public transparency API, which states the reserves of CASH in cash
 * and treasuries for all chains together. There is no Chainlink feed, so there is no price. The icons
 * are generic placeholders.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { poolPrice } from "../../src/crawler/apis/pools";
import { JsonApi } from "../../src/utils/requests";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "CASH",
    symbol: "CASH",
    identifier: {
        address: "CASHx9KJUStyftLFWGvEVf59SGeG9sh5FfcnZMVPCASH",
        system: "solana",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "bridge",
    },
    reference: "https://reserves.bridge.xyz/cash",
    tags: ["stablecoin", "real-world-asset"],
    backing: {
        method: "custodian",
        description:
            "Bridge's transparency API, which states the reserves of CASH on all chains together as cash and treasuries. Treasuries include money market funds that hold Treasury bills, they are recorded as Treasury bills. CASH on Solana gets the Solana share of the reserves, by supply. Updated daily.",
        reference: "https://reserves.bridge.xyz/cash",
    },
};

interface BridgeTransparency {
    last_updated: string;
    total_onchain_amount: string;
    total_reserve_amount: string;
    reserves: { type: string; amount: string }[];
}

const UNDERLYING: Record<string, bcked.asset.Id> = {
    cash: "rwa:USD",
    treasury: "rwa:USTB",
};

export default class Adapter implements bcked.asset.Adapter {
    bridge: JsonApi;

    constructor() {
        this.bridge = new JsonApi("https://transparency.bridge.xyz");
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        // No Chainlink feed for CASH. The Orca CASH/USDC Whirlpool on Solana.
        return poolPrice({
            kind: "whirlpool",
            pool: "3wijQvPKm6jHQrAkfPpok5o8WjCWPm1DGG17NmeW8q1w",
            tokenMint: details.identifier.address,
            quoteSymbol: "USDC",
        });
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        // Bridge mints and burns CASH on demand and holds no unissued tokens, so the circulating
        // supply is the mint's supply on-chain.
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
        const report = await this.bridge.fetchJson<BridgeTransparency>("/v0/stablecoins/cash");
        const timestamp = toISOString(new Date(report.last_updated));
        if (lastRecorded && lastRecorded.timestamp >= timestamp) return [];

        // The reserves cover CASH on all chains. The Solana asset gets its share by supply.
        const total = Number(report.total_onchain_amount);
        const solana = await onChainSupply(details.identifier.address, details.identifier.system);
        if (!(total > 0) || !(solana > 0)) return [];
        const share = Math.min(solana / total, 1);

        const underlying: Partial<Record<bcked.asset.Id, number>> = {};
        for (const { type, amount } of report.reserves) {
            const id = UNDERLYING[type];
            if (!id) throw Error(`Unknown reserve type in Bridge's CASH data: ${type}`);
            underlying[id] = (underlying[id] ?? 0) + Number(amount) * share;
        }
        return [{ timestamp, underlying }];
    }
}
