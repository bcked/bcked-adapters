/**
 * Hastra, a protocol operated by Signum Ltd. (British Virgin Islands), a subsidiary of Provenance
 * Cayman Foundation. It issues wYLDS by user action against USDC. See https://hastra.io/terms.
 */
const details: bcked.entity.Details = {
    name: "Hastra",
    identifier: "hastra",
    reference: "https://hastra.io/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
