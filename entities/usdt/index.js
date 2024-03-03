"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const details = {
    name: "United States Department of the Treasury",
    identifier: "usdt",
    reference: "https://home.treasury.gov/",
    tags: ["treasury"],
};
class Adapter {
    async getDetails() {
        return details;
    }
    async update() { }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map