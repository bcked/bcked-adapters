const details: bcked.entity.Details = {
    name: "Agora",
    identifier: "agora",
    reference: "https://www.agora.finance/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
