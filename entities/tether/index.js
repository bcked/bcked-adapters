"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const details = {
    name: "Tether",
    identifier: "tether",
    reference: "https://tether.to/",
    tags: [],
};
class Adapter {
    async getDetails() {
        return details;
    }
    async update() { }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map