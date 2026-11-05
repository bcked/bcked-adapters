const details: bcked.entity.Details = {
    name: "J.P. Morgan Asset Management",
    identifier: "jpmorgan",
    reference: "https://am.jpmorgan.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
