const details: bcked.system.Details = {
    name: "XRP Ledger",
    native: null,
    explorer: "https://livenet.xrpl.org/token/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
