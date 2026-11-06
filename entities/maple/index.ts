const details: bcked.entity.Details = {
    name: "Maple",
    identifier: "maple",
    reference: "https://maple.finance/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
