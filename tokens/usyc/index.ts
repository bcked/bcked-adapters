/**
 * Circle USYC on Ethereum, BNB Chain and Solana: tokens of the Hashnote International Short Duration
 * Yield Fund, which invests in short-term US Treasury bills and repo. The addresses are listed in
 * Circle's developer docs (https://developers.circle.com/tokenized/usyc/smart-contracts). USYC on Arc
 * is not tracked: bcked does not read Arc. Supply is read on-chain on each chain.
 *
 * The price is the net asset value per token from Chainlink's USYC NAV feed in its Aave LlamaGuard
 * version, the only USYC NAV feed in Chainlink's directory. The fund's holdings are not recorded:
 * Circle publishes no holdings that bcked can record.
 */
const details: bcked.token.Details = {
    name: "Circle USYC",
    symbol: "USYC",
    identifier: "usyc",
    issuer: "circle",
    reference: "https://developers.circle.com/tokenized/usyc/overview",
    backing: {
        method: "not-tracked",
        description: "Circle publishes no holdings of the fund that bcked can record.",
        reference: "https://developers.circle.com/tokenized/usyc/overview",
    },
    tags: ["real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
