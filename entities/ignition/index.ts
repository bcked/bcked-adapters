const details: bcked.entity.Details = {
    name: "Ignition",
    identifier: "ignition",
    reference: "https://www.fbtc.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
