/**
 * MoveUSD (MOVEUSD) on Solana, issued by CFX Labs (https://cfx.to/). CFX states that each token
 * represents US dollar deposits at FDIC-insured partner banks (https://cfx.to/on-chain). CFX
 * publishes no reserve figures that bcked may collect, so the backing is not recorded. There is no
 * Chainlink feed, so there is no price. The mint's on-chain metadata points to static.cfx.to, which
 * identifies the token. The icons are generic: CFX's terms reserve its logos.
 */
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "MoveUSD",
    symbol: "MOVEUSD",
    identifier: {
        address: "3AdhVEX6k85yNivHVXDEiY3WyP2WgFQTUZCahGaeC2qm",
        system: "solana",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "cfx",
    },
    reference: "https://cfx.to/on-chain",
    tags: ["stablecoin", "real-world-asset"],
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
        // No Chainlink feed for MOVEUSD.
        return [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        // CFX mints and burns through its own Solana program. Most tokens sit in ledger accounts that
        // CFX manages for its customers (https://docs.cfx.to/reference/get_v1-ledger-accounts-id),
        // so the total supply is reported without deductions.
        const { timestamp, issued } = await this.chain.getSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [{ timestamp, circulating: null, burned: null, total: issued, issued, max: null }];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
