/**
 * BTech Holdings, a Binance group company in the Abu Dhabi Global Market that issues the bStocks
 * certificates over US shares and funds on BNB Chain.
 */
const details: bcked.entity.Details = {
    name: "BTech Holdings",
    identifier: "btech",
    reference:
        "https://www.bnbchain.org/en/blog/introducing-bstocks-on-bnb-chain-trade-24-7-with-zero-fees-deploy-across-defi-protocols-with-full-self-custody",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
