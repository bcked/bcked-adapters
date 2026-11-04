const details: bcked.entity.Details = {
    name: "Bridge",
    identifier: "bridge",
    reference: "https://www.bridge.xyz/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
