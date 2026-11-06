const details: bcked.entity.Details = {
    name: "Falcon Finance",
    identifier: "falcon-finance",
    reference: "https://falcon.finance/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
