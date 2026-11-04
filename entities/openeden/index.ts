const details: bcked.entity.Details = {
    name: "OpenEden",
    identifier: "openeden",
    reference: "https://openeden.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
