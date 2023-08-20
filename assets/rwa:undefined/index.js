"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This asset can be used as fallback for an undefined US dollar denominated asset.
 */
const string_formatting_1 = require("../../src/utils/string_formatting");
const details = {
    name: "Undefined US Dollar denominated Asset",
    symbol: "undef",
    identifier: {
        address: "undefined",
        system: "rwa",
    },
    assetClasses: [],
    linkedEntities: {},
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