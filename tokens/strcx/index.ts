/**
 * Strategy PP Variable xStock (STRCx) on every tracked chain. A tracker certificate on Strategy's
 * Variable Rate Series A Perpetual Stretch Preferred Stock (STRC), issued by Backed Assets (JE)
 * Limited and collateralized 1:1 by STRC shares held with custodians. The issuer lists the token
 * addresses in its public asset data. Supply is read on-chain on each chain.
 *
 * There is no price: STRCx has no Chainlink price feed of its own. The shares held as collateral are
 * not recorded: the issuer publishes them through its website and API, whose terms do not allow
 * automated collection or republishing. STRCx on Mantle, HyperEVM, Monad, Optimism, Tron and TON is
 * not tracked yet.
 */
const details: bcked.token.Details = {
    name: "Strategy PP Variable xStock",
    symbol: "STRCx",
    identifier: "strcx",
    issuer: "backed",
    reference: "https://docs.xstocks.fi/docs/product-legal-overview",
    tags: ["real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
