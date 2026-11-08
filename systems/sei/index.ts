// Sei, an EVM chain (chain ID 1329), read through Alchemy.
const details: bcked.system.Details = {
    name: "Sei",
    native: null,
    explorer: "https://seiscan.io/address/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
