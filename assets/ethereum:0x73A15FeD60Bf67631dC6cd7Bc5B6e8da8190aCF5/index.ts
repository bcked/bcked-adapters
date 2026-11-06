/**
 * USD0 on Ethereum, the stablecoin of the Usual protocol, minted 1:1 against tokenized US Treasury
 * bills (USYC, M, USTBL and others). The address is listed in Usual's docs
 * (https://docs.usual.money/resources-and-ecosystem/fact-sheets/usual-products/usd0). USD0 on Arbitrum,
 * Base and BNB Chain is bridged from Ethereum, so the supply on Ethereum counts it. The price is the
 * Chainlink USD0/USD feed.
 *
 * The backing is not recorded yet. The collateral is held on-chain by Usual's treasury, but the docs
 * do not publish the treasury address, so its balances cannot be read.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "USD0",
    symbol: "USD0",
    identifier: {
        address: "0x73A15FeD60Bf67631dC6cd7Bc5B6e8da8190aCF5",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "usual",
    },
    reference: "https://docs.usual.money/resources-and-ecosystem/fact-sheets/usual-products/usd0",
    backing: {
        method: "not-tracked",
        description:
            "Usual holds the collateral (tokenized Treasury bills) on-chain, but does not publish the treasury address, so bcked cannot read it yet.",
        reference: "https://docs.usual.money/usual-products/usd0-stablecoin/usd0/rwa-collateral",
    },
    tags: ["stablecoin", "real-world-asset"],
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
