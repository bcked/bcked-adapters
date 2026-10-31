const details: bcked.system.Details = {
    name: "X Layer",
    native: null,
    explorer: "https://www.oklink.com/xlayer/token/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
