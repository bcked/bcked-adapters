"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const details = {
    name: "Ethereum",
    native: "ethereum:ETH",
    explorer: "https://etherscan.io/token/",
};
class Adapter {
    async getDetails() {
        return details;
    }
    async update() { }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map