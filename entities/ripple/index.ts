const details: bcked.entity.Details = {
    name: "Ripple",
    identifier: "ripple",
    reference: "https://ripple.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
