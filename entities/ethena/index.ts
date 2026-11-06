const details: bcked.entity.Details = {
    name: "Ethena",
    identifier: "ethena",
    reference: "https://ethena.fi/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
