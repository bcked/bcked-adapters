const details: bcked.entity.Details = {
    name: "Polymarket",
    identifier: "polymarket",
    reference: "https://polymarket.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
