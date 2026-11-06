/**
 * Lombard Staked BTC (LBTC) on Ethereum, Base, Avalanche, BNB Chain and Solana, bitcoin staked through
 * Lombard. The addresses are listed in Lombard's docs
 * (https://docs.lombard.finance/learn/transparency/smart-contracts). LBTC on Etherlink, MegaETH,
 * Monad, Stable, Sui and the deprecated chains is not tracked: bcked does not read them. Supply is
 * read on-chain. The price is the Chainlink LBTC/BTC feed in USD with BTC/USD.
 *
 * The backing is not recorded. Chainlink's Lombard Proof of Reserves feed reports the bitcoin behind
 * LBTC on all chains together, and the LBTC on chains bcked does not read cannot be measured, so the
 * share of each tracked chain is not known.
 */
const details: bcked.token.Details = {
    name: "Lombard Staked BTC",
    symbol: "LBTC",
    identifier: "lbtc",
    issuer: "lombard",
    reference: "https://docs.lombard.finance/learn/transparency/smart-contracts",
    backing: {
        method: "not-tracked",
        description:
            "Chainlink's Proof of Reserves reports the bitcoin behind LBTC on all chains together, but the LBTC on chains bcked does not track cannot be measured, so the share of each tracked chain is not recorded.",
        reference: "https://data.chain.link/feeds/ethereum/mainnet/lombard-por",
    },
    tags: ["wrapped-token", "staking-token"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
