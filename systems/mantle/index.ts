// Mantle, an EVM chain (chain ID 5000), read through Alchemy.
const details: bcked.system.Details = {
    name: "Mantle",
    native: null,
    explorer: "https://mantlescan.xyz/address/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
