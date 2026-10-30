const details: bcked.system.Details = {
    name: "Tron",
    native: null,
    explorer: "https://tronscan.org/#/token20/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
