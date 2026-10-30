const details: bcked.entity.Details = {
    name: "Lido",
    identifier: "lido",
    reference: "https://lido.fi/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
