const details: bcked.entity.Details = {
    name: "Arizore",
    identifier: "arizore",
    reference: "https://arizore.io/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
