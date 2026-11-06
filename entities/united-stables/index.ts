const details: bcked.entity.Details = {
    name: "United Stables",
    identifier: "united-stables",
    reference: "https://www.u.tech/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
