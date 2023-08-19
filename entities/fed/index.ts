const details: bcked.entity.Details = {
    name: "Federal Reserve",
    identifier: "fed",
    reference: "https://www.federalreserve.gov/",
    tags: ["central-bank"],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
