// Aptos, a Move chain, read through Alchemy's Aptos node API (src/crawler/chains/aptos.ts).
const details: bcked.system.Details = {
    name: "Aptos",
    native: null,
    explorer: "https://explorer.aptoslabs.com/fungible_asset/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
