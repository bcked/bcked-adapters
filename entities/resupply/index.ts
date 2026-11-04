const details: bcked.entity.Details = {
    name: "Resupply",
    identifier: "resupply",
    reference: "https://resupply.finance/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
