/**
 * Anemoy Limited, the manager of the Janus Henderson Anemoy Treasury Fund (JTRSY), a fund regulated
 * by the BVI Financial Services Commission. Its fund shares are issued as tokens through the
 * Centrifuge protocol. See https://www.anemoy.io/funds/jtrsy.
 */
const details: bcked.entity.Details = {
    name: "Anemoy",
    identifier: "anemoy",
    reference: "https://www.anemoy.io/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
