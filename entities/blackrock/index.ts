const details: bcked.entity.Details = {
    name: "BlackRock",
    identifier: "blackrock",
    reference: "https://www.blackrock.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
