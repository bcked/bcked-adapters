const details: bcked.system.Details = {
    name: "BNB Chain",
    native: null,
    explorer: "https://bscscan.com/token/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
