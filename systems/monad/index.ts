// Monad, an EVM chain (chain ID 143), read through Alchemy.
const details: bcked.system.Details = {
    name: "Monad",
    native: null,
    explorer: "https://monadscan.com/address/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
