const details: bcked.system.Details = {
    name: "Base",
    native: null,
    explorer: "https://basescan.org/token/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
