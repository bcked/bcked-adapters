const details: bcked.entity.Details = {
    name: "ether.fi",
    identifier: "etherfi",
    reference: "https://www.ether.fi/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
