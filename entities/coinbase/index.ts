const details: bcked.entity.Details = {
    name: "Coinbase",
    identifier: "coinbase",
    reference: "https://www.coinbase.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
