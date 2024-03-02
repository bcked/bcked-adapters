"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const details = {
    name: "Ethereum Foundation",
    identifier: "ethereum",
    reference: "https://ethereum.foundation/",
    tags: ["chain-operator"],
};
class Adapter {
    async getDetails() {
        return details;
    }
    async update() { }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map