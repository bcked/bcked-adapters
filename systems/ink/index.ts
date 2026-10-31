const details: bcked.system.Details = {
    name: "Ink",
    native: null,
    explorer: "https://explorer.inkonchain.com/token/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
