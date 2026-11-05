/**
 * Apyx, the protocol behind apxUSD and apyUSD. Its terms name Preference Capital (BVI) Ltd. and its
 * affiliates as the company that makes the protocol available:
 * https://docs.apyx.fi/resources/terms-of-service
 */
const details: bcked.entity.Details = {
    name: "Apyx",
    identifier: "apyx",
    reference: "https://docs.apyx.fi/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
