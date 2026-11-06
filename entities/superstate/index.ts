const details: bcked.entity.Details = {
    name: "Superstate",
    identifier: "superstate",
    reference: "https://superstate.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
