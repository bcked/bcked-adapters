/**
 * Ondo Short-Term US Government Bond Fund (OUSG) on the XRP Ledger, issued natively by the account
 * rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p. Ondo lists this issuer and currency in its documentation
 * (https://docs.ondo.finance/addresses), and the account's domain on the ledger is ondo.finance.
 *
 * Supply is the issuer's obligations in OUSG, read on-chain. There is no Chainlink feed for OUSG and
 * no on-chain pool, so there is no price. The fund's holdings are not recorded, see tokens/ousg.
 */
import { ChainProxy } from "../../src/crawler/chains/proxy";

const details: bcked.asset.Details = {
    name: "Ondo Short-Term US Government Bond Fund",
    symbol: "OUSG",
    identifier: {
        address: "OUSG.rHuiXXjHLpMP8ZE9sSQU5aADQVWDwv6h5p",
        system: "xrpl",
    },
    assetClasses: ["fund", "derivative"],
    linkedEntities: {
        issuer: "ondo",
    },
    reference: "https://docs.ondo.finance/addresses",
    tags: ["real-world-asset"],
    token: "ousg",
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
        // The issuer's obligations in OUSG: all OUSG held on trust lines against the issuer.
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
