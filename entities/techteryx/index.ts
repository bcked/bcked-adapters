const details: bcked.entity.Details = {
    name: "Techteryx",
    identifier: "techteryx",
    reference: "https://tusd.io/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
