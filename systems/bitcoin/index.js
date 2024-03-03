"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const details = {
    name: "Bitcoin",
    native: "bitcoin:BTC",
    explorer: "https://bitcoinexplorer.org/",
};
class Adapter {
    async getDetails() {
        return details;
    }
    async update() { }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map