const details: bcked.entity.Details = {
    name: "Lombard",
    identifier: "lombard",
    reference: "https://www.lombard.finance/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
