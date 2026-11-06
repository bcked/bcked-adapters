const details: bcked.entity.Details = {
    name: "Curve",
    identifier: "curve",
    reference: "https://www.curve.finance/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
