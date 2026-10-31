const details: bcked.system.Details = {
    name: "Robinhood Chain",
    native: null,
    explorer: "https://robinhoodchain.blockscout.com/token/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
