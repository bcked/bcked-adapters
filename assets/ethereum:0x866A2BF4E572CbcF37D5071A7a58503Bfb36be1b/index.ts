/**
 * M by M0 on Ethereum, its native chain, see src/crawler/adapters/m0.ts. M0 lists the contract in
 * its M Portal deployment files.
 *
 * Supply is read on-chain. M bridged to other chains is locked in the Hub Portal on Ethereum, so the
 * circulating supply on Ethereum excludes the Hub Portal balance. The price comes from the Chainlink
 * M NAV feed on Ethereum, which M0 reports.
 *
 * The backing is the Ethereum share of the collateral of the active minters, read from the
 * MinterGateway. The icon is generic: M0's website terms allow personal, non-commercial use only.
 */
import { M_HUB_PORTAL, mBacking } from "../../src/crawler/adapters/m0";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "M by M0",
    symbol: "M",
    identifier: {
        address: "0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "m0",
    },
    reference: "https://github.com/m0-platform/m-portal/blob/main/deployments/mainnet.md",
    tags: ["stablecoin"],
    token: "m",
    backing: {
        method: "on-chain",
        description:
            "The collateral of the active minters as recorded by the M0 MinterGateway on Ethereum, which backs M on all chains, read from the chain every hour. Validators confirm each update on-chain. The composition of the collateral is not recorded on-chain. M on Ethereum gets the share of its circulating supply.",
        reference: "https://docs.m0.org/protocol/m-token",
        address: "0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b",
    },
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
            this.chain.getBalance(M_HUB_PORTAL, address, system),
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
        const [supply] = await this.getSupply();
        return [await mBacking(this.chain, supply!.circulating!)];
    }
}
