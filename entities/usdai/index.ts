const details: bcked.entity.Details = {
    name: "USD.AI",
    identifier: "usdai",
    reference: "https://usd.ai/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
