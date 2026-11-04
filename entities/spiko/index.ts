const details: bcked.entity.Details = {
    name: "Spiko",
    identifier: "spiko",
    reference: "https://www.spiko.io/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
