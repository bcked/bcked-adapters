const details: bcked.entity.Details = {
    name: "Tether",
    identifier: "tether",
    reference: "https://tether.to/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
