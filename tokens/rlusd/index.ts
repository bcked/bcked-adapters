/**
 * Ripple USD on every tracked chain, issued by Standard Custody & Trust, a subsidiary of Ripple. Its
 * reserves are reported monthly for all chains together
 * (https://ripple.com/products/stablecoin/transparency/), but Ripple's terms do not allow automated
 * collection (https://ripple.com/terms-of-use/), so the backing is not recorded yet.
 */
const details: bcked.token.Details = {
    name: "Ripple USD",
    symbol: "RLUSD",
    identifier: "rlusd",
    issuer: "ripple",
    reference: "https://ripple.com/products/stablecoin/transparency/",
    tags: ["stablecoin", "real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
