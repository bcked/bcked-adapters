/**
 * OpenEden TBILL Vault (TBILL) on every tracked chain. OpenEden lists the vault contracts, which are
 * also the tokens, in its docs (https://docs.openeden.com/tbill/smart-contract-addresses). Supply is
 * read on-chain on each chain. The price is the net asset value per token from the Chainlink TBILL NAV
 * feed on Ethereum.
 *
 * The fund's holdings are not recorded: the terms of OpenEden's website and platform do not allow
 * copying or scraping its content, and the fund administrator's NAV reports are not public. TBILL on
 * Solana and the XRP Ledger is not tracked, as OpenEden does not publish those token addresses.
 */
const details: bcked.token.Details = {
    name: "OpenEden TBILL Vault",
    symbol: "TBILL",
    identifier: "tbill",
    issuer: "openeden",
    reference: "https://docs.openeden.com/tbill/introduction",
    tags: ["real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
