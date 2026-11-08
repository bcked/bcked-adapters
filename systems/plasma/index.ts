// Plasma, an EVM chain (chain ID 9745), read through Alchemy.
const details: bcked.system.Details = {
    name: "Plasma",
    native: null,
    explorer: "https://plasmascan.to/address/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
