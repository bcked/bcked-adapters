const details: bcked.entity.Details = {
    name: "Threshold Network",
    identifier: "threshold",
    reference: "https://www.threshold.network/",
    tags: ["dao", "bridge-provider"],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
