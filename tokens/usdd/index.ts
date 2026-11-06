/**
 * USDD, a US dollar stablecoin minted against collateral in vaults (a fork of the Maker protocol),
 * with a separate set of contracts on Tron, Ethereum and BNB Chain. The addresses are listed in the
 * USDD docs (https://docs.usdd.io/developers/deployment-addresses). The older USDD (USDDOLD, Tron
 * TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn) is a different token and not tracked. Supply is read on-chain.
 * The price is Chainlink's USDD/USDC exchange rate times USDC/USD.
 *
 * The backing is the collateral in the Vats on all three chains, read on-chain. Each chain gets the
 * share that its supply has of all USDD minted (src/crawler/adapters/usdd.ts), so USDD on chains
 * bcked does not read, like BitTorrent Chain, keeps its share.
 */

export const USDD_ASSETS: bcked.asset.Id[] = [
    "tron:TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz",
    "ethereum:0x4f8e5DE400DE08B164E7421B3EE387f461beCD1A",
    "bsc:0x45E51bc23D592EB2DBA86da3985299f7895d66Ba",
];
const details: bcked.token.Details = {
    name: "USDD",
    symbol: "USDD",
    identifier: "usdd",
    issuer: "usdd",
    reference: "https://docs.usdd.io/introduction/collateral-asset-contract-addresses",
    backing: {
        method: "on-chain",
        description:
            "The collateral in USDD's Vats on Tron, Ethereum and BNB Chain, read on-chain. Each chain gets the share that its supply has of all USDD minted. Vaults whose collateral bcked does not track, like the Smart Allocator, count at their debt.",
        reference: "https://docs.usdd.io/introduction/collateral-asset-contract-addresses",
    },
    tags: ["stablecoin"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
