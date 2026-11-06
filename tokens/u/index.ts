/**
 * U by United Stables on BNB Chain, Ethereum and Tron, the chains listed on United Stables'
 * multichain page (https://www.u.tech/ecosystem/multichain/). Supply is read on-chain. The price is
 * the Chainlink U/USD feed.
 *
 * The backing is Chainlink's United Stables U Reserves feed on BNB Chain, named on United Stables'
 * proof of reserves page (https://www.u.tech/por/). It reports the reserves for U on all chains
 * together. Each chain gets the share that matches its supply (src/crawler/adapters/por_share.ts).
 */
import type { PorFeed } from "../../src/crawler/adapters/por_share";

export const U_POR: PorFeed = {
    address: "0xFa8e834DD2200923C706e6438d9030dB029B0c18",
    system: "bsc",
    underlying: "rwa:USD",
};

export const U_ASSETS: bcked.asset.Id[] = [
    "bsc:0xcE24439F2D9C6a2289F741120FE202248B666666",
    "ethereum:0xcE24439F2D9C6a2289F741120FE202248B666666",
    "tron:TFNirp6PbqYE1ZTtWuCMUKJWLNZkoCoeFJ",
];

const details: bcked.token.Details = {
    name: "United Stables",
    symbol: "U",
    identifier: "u",
    issuer: "united-stables",
    reference: "https://www.u.tech/por/",
    backing: {
        method: "custodian",
        description:
            "Chainlink's Proof of Reserves feed reports the reserves behind U on all chains together. Each chain gets the share that matches its supply.",
        reference: "https://www.u.tech/por/",
    },
    tags: ["stablecoin"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
