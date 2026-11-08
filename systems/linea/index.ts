// Linea, an EVM chain (chain ID 59144), read through Alchemy.
const details: bcked.system.Details = {
    name: "Linea",
    native: null,
    explorer: "https://lineascan.build/address/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
