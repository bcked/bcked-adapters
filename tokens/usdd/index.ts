/**
 * USDD, a US dollar stablecoin minted against collateral in vaults (a fork of the Maker protocol),
 * with a separate set of contracts on Tron, Ethereum and BNB Chain. The addresses are listed in the
 * USDD docs (https://docs.usdd.io/developers/deployment-addresses). The older USDD (USDDOLD, Tron
 * TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn) is a different token and not tracked. Supply is read on-chain.
 * The price is Chainlink's USDD/USDC exchange rate times USDC/USD.
 *
 * The backing is not recorded yet. Each chain's Vat holds its own collateral (TRX, sTRX, WBTC and
 * USDT on Tron, ETH and WBTC on Ethereum), stablecoins in the peg stability modules, and USDD lent
 * out by the Smart Allocator vault (SA001). All of it is on-chain, but the reading of the vaults is
 * not built yet.
 */
const details: bcked.token.Details = {
    name: "USDD",
    symbol: "USDD",
    identifier: "usdd",
    issuer: "usdd",
    reference: "https://docs.usdd.io/introduction/collateral-asset-contract-addresses",
    backing: {
        method: "not-tracked",
        description:
            "USDD is backed by collateral in on-chain vaults on Tron, Ethereum and BNB Chain, which bcked does not read yet.",
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
