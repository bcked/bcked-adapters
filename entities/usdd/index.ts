const details: bcked.entity.Details = {
    name: "USDD",
    identifier: "usdd",
    reference: "https://usdd.io/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
