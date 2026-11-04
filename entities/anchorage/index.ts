const details: bcked.entity.Details = {
    name: "Anchorage Digital",
    identifier: "anchorage",
    reference: "https://www.anchorage.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
