const details: bcked.entity.Details = {
    name: "Inverse Finance",
    identifier: "inverse",
    reference: "https://www.inverse.finance/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
