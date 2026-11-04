const details: bcked.entity.Details = {
    name: "Binance",
    identifier: "binance",
    reference: "https://www.binance.com/en/bstocks-landing",
    tags: ["cex"],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
