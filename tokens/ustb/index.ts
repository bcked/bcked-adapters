/**
 * Superstate Short Duration US Government Securities Fund (USTB) on Ethereum, Plume and Solana. The fund
 * invests in short-term US Treasury bills. Superstate lists the token addresses in its docs
 * (https://docs.superstate.com/investors/smart-contracts). Supply is read on-chain on each chain. The
 * price is the net asset value per share from the Chainlink USTB oracle that Superstate names.
 *
 * The fund's holdings are not recorded: Superstate shows them on its website, which bcked does not
 * collect.
 */
const details: bcked.token.Details = {
    name: "Superstate Short Duration US Government Securities Fund",
    symbol: "USTB",
    identifier: "ustb",
    issuer: "superstate",
    reference: "https://docs.superstate.com/investors/smart-contracts",
    backing: {
        method: "not-tracked",
        description:
            "Superstate publishes the fund's holdings on its website, but bcked does not record them yet.",
        reference: null,
    },
    tags: ["real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
