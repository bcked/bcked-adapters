const details: bcked.entity.Details = {
    name: "Solv Protocol",
    identifier: "solv",
    reference: "https://solv.finance/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
