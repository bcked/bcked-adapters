"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const details = {
    name: "BitGo",
    identifier: "bitgo",
    reference: "https://www.bitgo.com/",
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