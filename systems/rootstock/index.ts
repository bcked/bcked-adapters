// Rootstock, an EVM chain merge-mined with bitcoin (chain ID 30), read through Alchemy.
const details: bcked.system.Details = {
    name: "Rootstock",
    native: "rootstock:RBTC",
    explorer: "https://explorer.rootstock.io/address/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
