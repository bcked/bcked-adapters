// Plume, an EVM chain (chain ID 98866). RPC and explorer from the Plume docs:
// https://docs.plume.org/plume/developers/network-information
const details: bcked.system.Details = {
    name: "Plume",
    native: null,
    explorer: "https://explorer.plume.org/token/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
