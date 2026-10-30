const details: bcked.system.Details = {
    name: "Polygon",
    native: null,
    explorer: "https://polygonscan.com/token/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
