const details: bcked.entity.Details = {
    name: "Aave",
    identifier: "aave",
    reference: "https://aave.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
