const details: bcked.system.Details = {
    name: "Ethereum",
    native: "ethereum:ETH",
    explorer: "https://etherscan.io/token/",
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
