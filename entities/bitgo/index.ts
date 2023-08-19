const details: bcked.entity.Details = {
    name: "BitGo",
    identifier: "bitgo",
    reference: "https://www.bitgo.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
