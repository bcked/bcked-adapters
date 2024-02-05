"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRManager = void 0;
/**
 * Provides an interface to BlackRock data.
 * All attribution goes to the BlackRock.
 */
const path_1 = __importDefault(require("path"));
const requests_1 = require("../../utils/requests");
const descriptionAssetMapping = {
    "WI TREASURY BILL": "rwa:USTB-WI",
    "TREASURY BILL": "rwa:USTB",
    "WI TREASURY NOTE": "rwa:USTNOTE-WI",
    "TREASURY NOTE": "rwa:USTNOTE",
    "WI TREASURY BOND": "rwa:USTBOND-WI",
    "TREASURY BOND": "rwa:USTBOND",
    "TRI-PARTY": "rwa:USTrepo",
    TREASURY: "rwa:USTB",
};
class BRManager {
    constructor() {
        this.api = new requests_1.CsvApi("https://www.blackrock.com");
    }
    getProductUrl(product) {
        return `/cash/en-us/products/${product}`;
    }
    getFundUrl(product, fund, options) {
        return path_1.default.join(this.getProductUrl(product), `fund/${fund}.ajax?${(0, requests_1.joinOptions)(options)}`);
    }
    mapAsset(description) {
        for (const [keyword, asset] of Object.entries(descriptionAssetMapping)) {
            if (description.toLowerCase().startsWith(keyword.toLowerCase())) {
                return asset;
            }
        }
        return "rwa:undefined";
    }
    async getPositions(product, fund, options) {
        const url = this.getFundUrl(product, fund, options);
        const positions = await this.api.fetchCsv(url, {
            columns: true,
            from_line: 3,
            skip_empty_lines: true,
            skip_records_with_error: true,
        });
        if (!positions?.length)
            return null;
        return positions.map((value) => ({
            identifier: value.Identifier,
            asset: this.mapAsset(value["Position Description"]),
            description: value["Position Description"],
            exchange: value.Exchange,
            par: parseFloat(value.Par.replaceAll(",", "")),
            par_percent: value["%Par"],
            yield_coupon: value["Yield/Coupon"],
            final: value.Final,
            maturity_reset: value["Maturity/Reset"],
        }));
    }
}
exports.BRManager = BRManager;
//# sourceMappingURL=br_manager.js.map