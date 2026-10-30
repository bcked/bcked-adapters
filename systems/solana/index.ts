const details: bcked.system.Details = {
    name: "Solana",
    native: null,
    explorer: "https://solscan.io/token/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
