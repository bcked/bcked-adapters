/**
 * apxUSD on Ethereum, issued by Apyx. Ethereum is its native chain. The token address is listed in
 * Apyx's docs: https://docs.apyx.fi/resources/smart-contract-addresses
 *
 * Supply is read on-chain. apxUSD bridged to other chains through Chainlink CCIP is locked in the
 * Lock & Release pool on Ethereum, so the circulating supply on Ethereum excludes the pool balance.
 * The pool address is from Chainlink's CCIP directory.
 *
 * The price comes from Chainlink's APXUSD / USD Exchange Rate feed on Ethereum.
 *
 * The backing is not recorded. apxUSD is backed by preferred shares (Strategy's STRC, also as STRCx,
 * and Strive's SATA), cash and stablecoins held by the issuer. Apyx shows the reserves on a dashboard
 * and publishes monthly attestation reports that cover the preferred shares only. The icon is
 * generic: the terms do not allow using its logo without written consent.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

// Holds the apxUSD bridged to other chains (Chainlink CCIP Lock & Release pool).
const BRIDGE_POOL = "0x0e9cA42Bc60bE25F9A67f52173067Cc0Bb405BB5";

const details: bcked.asset.Details = {
    name: "apxUSD",
    symbol: "apxUSD",
    identifier: {
        address: "0x98A878b1Cd98131B271883B390f68D2c90674665",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "apyx",
    },
    reference: "https://docs.apyx.fi/resources/smart-contract-addresses",
    tags: ["stablecoin"],
    token: "apxusd",
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
