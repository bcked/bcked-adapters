const details: bcked.entity.Details = {
    name: "United States Department of the Treasury",
    identifier: "usdt",
    reference: "https://home.treasury.gov/",
    tags: ["treasury"],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
