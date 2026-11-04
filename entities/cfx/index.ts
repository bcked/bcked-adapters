const details: bcked.entity.Details = {
    name: "CFX Labs",
    identifier: "cfx",
    reference: "https://cfx.to/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
