const details: bcked.system.Details = {
    name: "Bitcoin",
    native: "bitcoin:BTC",
    explorer: "https://bitcoinexplorer.org/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
