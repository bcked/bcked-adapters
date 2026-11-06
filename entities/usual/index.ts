const details: bcked.entity.Details = {
    name: "Usual",
    identifier: "usual",
    reference: "https://usual.money/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
