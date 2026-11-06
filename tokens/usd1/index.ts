/**
 * USD1 by World Liberty Financial on Ethereum, BNB Chain, Solana and Tron. The addresses are listed in
 * World Liberty Financial's docs (https://docs.worldlibertyfinancial.com/usd1-token/contract-addresses).
 * USD1 is issued natively on Ethereum, BNB Chain, Solana, Tron, Aptos and Tempo. On the other chains it
 * is minted against USD1 locked in Chainlink CCIP pools on a native chain, so the supply on the native
 * chains counts it once. Supply is read on-chain. The price is the Chainlink USD1/USD feed.
 *
 * The backing is not recorded. A Chainlink oracle on Ethereum (0x691b74146cdba162449012aa32d3cbf5df77d4c4,
 * named in World Liberty Financial's MIT licensed dashboard, https://github.com/worldliberty/cre-por-dashboard)
 * reports the reserves for USD1 on all chains together. USD1 on Aptos and Tempo is not read (the
 * Aptos Labs API requires an account), so the share of each tracked chain cannot be measured.
 */
const details: bcked.token.Details = {
    name: "USD1",
    symbol: "USD1",
    identifier: "usd1",
    issuer: "world-liberty-financial",
    reference: "https://docs.worldlibertyfinancial.com/usd1-token/proof-of-reserves",
    backing: {
        method: "not-tracked",
        description:
            "A Chainlink oracle reports the reserves behind USD1 on all chains together, but the USD1 on chains bcked does not track cannot be measured, so the share of each tracked chain is not recorded.",
        reference: "https://docs.worldlibertyfinancial.com/usd1-token/proof-of-reserves",
    },
    tags: ["stablecoin", "real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
