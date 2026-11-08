/**
 * M by M0 on Solana, bridged from Ethereum through the M0 portals, see src/crawler/adapters/m0.ts.
 * M0 lists the token address on its addresses page (https://docs.m0.org/resources/addresses).
 *
 * Supply is the token's totalSupply, read on-chain. The price comes from the Chainlink M NAV feed on
 * Ethereum. The backing is the Solana share of the collateral of the active minters, read from the
 * MinterGateway on Ethereum.
 */
import { onChainSupply } from "../../src/crawler/adapters/circulating";
import { mBacking } from "../../src/crawler/adapters/m0";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "M by M0",
    symbol: "M",
    identifier: {
        address: "mzerokyEX9TNDoK4o2YZQBDmMzjokAeN6M2g2S3pLJo",
        system: "solana",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "m0",
    },
    reference: "https://docs.m0.org/resources/addresses",
    tags: ["stablecoin"],
    token: "m",
    backing: {
        method: "on-chain",
        description:
            "The collateral of the active minters as recorded by the M0 MinterGateway on Ethereum, which backs M on all chains, read from the chain every hour. Validators confirm each update on-chain. The composition of the collateral is not recorded on-chain. M on Solana gets the share of its supply.",
        reference: "https://docs.m0.org/protocol/m-token",
        address: "mzerokyEX9TNDoK4o2YZQBDmMzjokAeN6M2g2S3pLJo",
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
        // Minted by the M0 Portal program on Solana for M locked on Ethereum.
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

    async getBacking(): Promise<bcked.asset.Backing[]> {
        const [supply] = await this.getSupply();
        return [await mBacking(this.chain, supply!.circulating!)];
    }
}
