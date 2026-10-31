const details: bcked.entity.Details = {
    name: "Sky",
    identifier: "sky",
    reference: "https://sky.money/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
