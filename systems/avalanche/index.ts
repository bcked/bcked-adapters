const details: bcked.system.Details = {
    name: "Avalanche",
    native: null,
    explorer: "https://snowtrace.io/token/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
