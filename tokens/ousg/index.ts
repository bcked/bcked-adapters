/**
 * Ondo Short-Term US Government Bond Fund (OUSG) on every tracked chain. Ondo lists the token
 * addresses in its documentation (https://docs.ondo.finance/addresses). Supply is read on-chain on
 * each chain. rOUSG, the rebasing version, holds OUSG and is counted in the OUSG supply.
 *
 * There is no price: OUSG has no Chainlink feed and no on-chain pool. The fund's holdings are not
 * recorded: Ondo publishes them on its website, whose terms do not allow automated collection, and
 * does not list the addresses that hold them.
 */
const details: bcked.token.Details = {
    name: "Ondo Short-Term US Government Bond Fund",
    symbol: "OUSG",
    identifier: "ousg",
    issuer: "ondo",
    reference: "https://docs.ondo.finance/addresses",
    tags: ["real-world-asset"],
};

export default class Adapter implements bcked.token.Adapter {
    async getDetails(): Promise<bcked.token.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
