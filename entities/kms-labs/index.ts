const details: bcked.entity.Details = {
    name: "KMS Labs",
    identifier: "kms-labs",
    reference: "https://kmslabs.money/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
