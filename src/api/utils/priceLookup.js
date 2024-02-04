"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsecutivePriceLookup = void 0;
const date_fns_1 = require("date-fns");
const path_1 = __importDefault(require("path"));
const csv_1 = require("../../utils/csv");
const time_1 = require("../../utils/time");
const ASSETS_PATH = "assets";
class ConsecutivePriceLookup {
    constructor(assetId) {
        this.assetId = assetId;
        this.prices = new Map();
        this.done = false;
        this.lastTimestamp = undefined;
        const csvPath = path_1.default.join(ASSETS_PATH, assetId, "records", "price.csv");
        this.csvStream = (0, csv_1.readCSV)(csvPath);
    }
    async getClosest(timestamp, window = (0, date_fns_1.hoursToMilliseconds)(12)) {
        // Read new prices from csvStream and store them in the prices map
        while (!this.done && // Stop if the csvStream is done
            (!this.lastTimestamp || !(0, time_1.isNewer)(timestamp, this.lastTimestamp, window)) // Read ahead the specified time window
        ) {
            const { value: price, done } = await this.csvStream.next();
            this.done = done;
            if (!price)
                break;
            this.prices.set(price.timestamp, price);
            this.lastTimestamp = price.timestamp;
        }
        // Find the best match in the prices cache
        let bestMatch;
        let bestDistance;
        for (const price of this.prices.values()) {
            // Ignore and delete entries older than time window
            if ((0, time_1.isNewer)(price.timestamp, timestamp, window)) {
                this.prices.delete(price.timestamp);
                continue;
            }
            const timeDistance = (0, time_1.distance)(timestamp, price.timestamp);
            if (!bestDistance || timeDistance < bestDistance) {
                bestMatch = price;
                bestDistance = timeDistance;
            }
            else {
                break; // Prices are sorted, so we can stop here.
            }
        }
        return bestMatch;
    }
}
exports.ConsecutivePriceLookup = ConsecutivePriceLookup;
//# sourceMappingURL=priceLookup.js.map