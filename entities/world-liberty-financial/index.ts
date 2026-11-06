const details: bcked.entity.Details = {
    name: "World Liberty Financial",
    identifier: "world-liberty-financial",
    reference: "https://worldlibertyfinancial.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
