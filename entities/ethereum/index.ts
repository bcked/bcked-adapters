const details: bcked.entity.Details = {
    name: "Ethereum Foundation",
    identifier: "ethereum",
    reference: "https://ethereum.foundation/",
    tags: ["chain-operator"],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
