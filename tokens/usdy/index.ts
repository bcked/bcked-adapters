/**
 * USDY (Ondo US Dollar Yield), a token of Ondo Finance backed by short-term US Treasuries and bank
 * deposits, whose value grows with the yield. The addresses are listed on Ondo's smart contract
 * addresses page (https://docs.ondo.finance/addresses), read once by hand. USDY is tracked on
 * Ethereum, BNB Chain, Solana, Sei, Arbitrum, Tempo and Mantle. USDY on Sui, Aptos, Noble and Stellar
 * is not tracked: bcked does not read Sui, Noble and Stellar, and USDY on Aptos is a coin type that
 * bcked's asset ids cannot hold (about 1,700 USDY on 2026-11-08). Supply is read on-chain. On
 * 2026-11-08 no bridge on Ethereum held a notable amount of USDY, so the chains do not count bridged
 * USDY twice. The price comes from the Orca USDY/USDC pool on Solana (src/crawler/adapters/usdy.ts).
 *
 * The backing is not recorded: Ondo shows the holdings on its website and app, whose terms do not
 * allow automated collection.
 */
const details: bcked.token.Details = {
    name: "Ondo US Dollar Yield",
    symbol: "USDY",
    identifier: "usdy",
    issuer: "ondo",
    reference: "https://docs.ondo.finance/addresses",
    backing: {
        method: "not-tracked",
        description:
            "Ondo publishes the holdings behind USDY (short-term US Treasuries and bank deposits) on its website and app only.",
        reference: "https://ondo.finance/usdy",
    },
    tags: ["real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
