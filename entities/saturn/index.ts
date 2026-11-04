const details: bcked.entity.Details = {
    name: "Saturn",
    identifier: "saturn",
    reference: "https://saturn.credit/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
