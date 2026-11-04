const details: bcked.entity.Details = {
    name: "Avant Protocol",
    identifier: "avant",
    reference: "https://www.avantprotocol.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
