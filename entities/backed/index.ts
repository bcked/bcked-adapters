const details: bcked.entity.Details = {
    name: "Backed Assets (JE) Limited",
    identifier: "backed",
    reference: "https://assets.backed.fi/legal-documentation/issuer",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
