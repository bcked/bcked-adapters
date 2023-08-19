"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Treasury Auctions can be looked up here: https://www.treasurydirect.gov/auctions/auction-query/
 */
const string_formatting_1 = require("../../src/utils/primitive/string_formatting");
const details = {
    name: "U.S. Treasury Bonds",
    symbol: "USTBOND",
    identifier: {
        address: "USTBOND",
        system: "rwa",
    },
    assetClasses: ["fixed-income-security", "cash-equivalent"],
    linkedEntities: { issuer: "usdt" },
    reference: null,
    tags: [],
};
class Adapter {
    async getDetails() {
        return details;
    }
    async getPrice() {
        return [
            {
                timestamp: (0, string_formatting_1.toISOString)(new Date(0)),
                usd: 1.0, // Assume a fixed price of $1.0.
            },
        ];
    }
    async getSupply() {
        return [];
    }
    async getBacking() {
        return [];
    }
}
exports.default = Adapter;
//# sourceMappingURL=index.js.map