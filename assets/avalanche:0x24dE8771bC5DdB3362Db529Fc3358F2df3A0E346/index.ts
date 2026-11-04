/**
 * Avant USD (avUSD) on Avalanche, issued by Avant Protocol. Avalanche is its native chain. The
 * token address is listed in Avant's docs: https://docs.avantprotocol.com/security/contract-addresses
 *
 * Supply is read on-chain. avUSD bridged to other chains through Chainlink CCIP is locked in the
 * Lock & Release pool on Avalanche, so the circulating supply on Avalanche excludes the pool balance.
 * There is no Chainlink feed for avUSD, so there is no price.
 *
 * The backing is not recorded. avUSD is backed by assets in actively managed strategies across
 * several chains and venues. Avant publishes a breakdown on its transparency page
 * (https://app.avantprotocol.com/transparency), but its terms do not allow automated access
 * (https://docs.avantprotocol.com/legal-and-risk/terms-of-use). The icon is generic: the terms do
 * not allow using its logo without written consent.
 */
import { ChainProxy } from "../../src/crawler/chains/proxy";

// Holds the avUSD bridged to other chains (Chainlink CCIP Lock & Release pool).
const BRIDGE_POOL = "0xD4fe4186c4A7b089eb849d57b43C5F6a3d3BcCbe";

const details: bcked.asset.Details = {
    name: "Avant USD",
    symbol: "avUSD",
    identifier: {
        address: "0x24dE8771bC5DdB3362Db529Fc3358F2df3A0E346",
        system: "avalanche",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "avant",
    },
    reference: "https://docs.avantprotocol.com/security/contract-addresses",
    tags: ["stablecoin"],
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
        return [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { address, system } = details.identifier;
        const [{ timestamp, issued, burned }, { balance: locked }] = await Promise.all([
            this.chain.getSupply(address, system),
            this.chain.getBalance(BRIDGE_POOL, address, system),
        ]);
        const total = issued - (burned ?? 0);
        return [
            {
                timestamp,
                circulating: total - locked,
                burned: burned ?? null,
                total,
                issued,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        return [];
    }
}
