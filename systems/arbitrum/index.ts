const details: bcked.system.Details = {
    name: "Arbitrum One",
    native: null,
    explorer: "https://arbiscan.io/token/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
