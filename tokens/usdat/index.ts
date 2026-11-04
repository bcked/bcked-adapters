/**
 * Saturn Dollar (USDat) on every tracked chain, see src/crawler/adapters/usdat.ts. The backing is
 * PYUSDx held by the USDat contract on Ethereum, read on-chain. Each chain asset gets its share.
 * USDat on Monad is not tracked yet.
 */
const details: bcked.token.Details = {
    name: "Saturn Dollar",
    symbol: "USDat",
    identifier: "usdat",
    issuer: "saturn",
    reference: "https://saturncredit.gitbook.io/saturn-docs/solution/usdat-overview",
    tags: ["stablecoin"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
