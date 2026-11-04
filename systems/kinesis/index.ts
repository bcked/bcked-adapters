const details: bcked.system.Details = {
    name: "Kinesis",
    native: null,
    explorer: "https://explorer.kinesis.money/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
