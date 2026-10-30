const details: bcked.entity.Details = {
    name: "Circle",
    identifier: "circle",
    reference: "https://www.circle.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
