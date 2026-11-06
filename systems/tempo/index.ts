// Tempo, an EVM chain (chain ID 4217), read through Alchemy.
const details: bcked.system.Details = {
    name: "Tempo",
    native: null,
    explorer: "https://explore.tempo.xyz/address/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
