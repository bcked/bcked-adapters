const details: bcked.entity.Details = {
    name: "Frax",
    identifier: "frax",
    reference: "https://frax.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
