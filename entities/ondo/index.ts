const details: bcked.entity.Details = {
    name: "Ondo Finance",
    identifier: "ondo",
    reference: "https://ondo.finance/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
