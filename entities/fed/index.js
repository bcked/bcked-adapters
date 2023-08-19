"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const details = {
    name: "Federal Reserve",
    identifier: "fed",
    reference: "https://www.federalreserve.gov/",
    tags: ["central-bank"],
};
class Adapter {
    async getDetails() {
        return details;
    }
    async update() { }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map