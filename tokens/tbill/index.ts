/**
 * OpenEden TBILL Vault (TBILL) on every tracked chain. OpenEden lists the vault contracts, which are
 * also the tokens, in its docs (https://docs.openeden.com/tbill/smart-contract-addresses). Supply is
 * read on-chain on each chain. The price is the net asset value per token from the Chainlink TBILL NAV
 * feed on Ethereum.
 *
 * The fund's holdings are not recorded: the terms of OpenEden's website and platform do not allow
 * copying or scraping its content, and the fund administrator's NAV reports are only shown to investors
 * on that platform. TBILL on Solana and the XRP Ledger is not tracked, as OpenEden does not publish
 * those token addresses. TBILL on Arbitrum (0xF84D28A8D28292842dD73D1c5F99476A80b6666A) had no supply
 * on 2026-11-04. The v1 vault on Ethereum (0xad6250f0BD49F7a1eB11063af2cE9F25B9597b0F), which OpenEden
 * lists as deprecated, still had a supply of about 11.39M on that day and is not tracked.
 */
const details: bcked.token.Details = {
    name: "OpenEden TBILL Vault",
    symbol: "TBILL",
    identifier: "tbill",
    issuer: "openeden",
    reference: "https://docs.openeden.com/tbill/introduction",
    backing: {
        method: "not-tracked",
        description:
            "OpenEden shows the fund's holdings only to its investors, so bcked does not record them.",
        reference: "https://docs.openeden.com/tbill/introduction",
    },
    tags: ["real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
