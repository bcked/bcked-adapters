const details: bcked.entity.Details = {
    name: "M0",
    identifier: "m0",
    reference: "https://www.m0.org/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
