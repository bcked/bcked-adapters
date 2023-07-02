"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasCachedBacking = exports.getCachedBacking = exports.hasCachedSupply = exports.getCachedSupply = exports.hasCachedPrice = exports.getCachedPrice = exports.hasCached = exports.getCached = void 0;
const fs = require("fs");
const helper_1 = require("./helper");
const csv_1 = require("./primitive/csv");
const time_1 = require("./primitive/time");
async function getCached(pathToFile, timestamp, threshold = (0, time_1.minInMs)(10)) {
    if (!fs.existsSync(pathToFile))
        return null;
    const data = await (0, csv_1.readLastEntry)(pathToFile);
    const duration = new Date(timestamp).getTime() - new Date(data.timestamp).getTime();
    if (duration > threshold)
        return null;
    return data;
}
exports.getCached = getCached;
async function hasCached(pathToFile, timestamp, threshold = (0, time_1.minInMs)(10)) {
    const cached = await getCached(pathToFile, timestamp, threshold);
    return cached != null;
}
exports.hasCached = hasCached;
async function getCachedPrice(identifier, timestamp, threshold = (0, time_1.minInMs)(10)) {
    return getCached((0, helper_1.getPriceCsvPath)(identifier), timestamp, threshold);
}
exports.getCachedPrice = getCachedPrice;
async function hasCachedPrice(identifier, timestamp, threshold = (0, time_1.minInMs)(10)) {
    const cachedPrice = await getCachedPrice(identifier, timestamp, threshold);
    return cachedPrice != null;
}
exports.hasCachedPrice = hasCachedPrice;
async function getCachedSupply(identifier, timestamp, threshold = (0, time_1.minInMs)(10)) {
    return getCached((0, helper_1.getSupplyCsvPath)(identifier), timestamp, threshold);
}
exports.getCachedSupply = getCachedSupply;
async function hasCachedSupply(identifier, timestamp, threshold = (0, time_1.minInMs)(10)) {
    const cachedSupply = await getCachedSupply(identifier, timestamp, threshold);
    return cachedSupply != null;
}
exports.hasCachedSupply = hasCachedSupply;
async function getCachedBacking(identifier, timestamp, threshold = (0, time_1.minInMs)(10)) {
    return getCached((0, helper_1.getBackingCsvPath)(identifier), timestamp, threshold);
}
exports.getCachedBacking = getCachedBacking;
async function hasCachedBacking(identifier, timestamp, threshold = (0, time_1.minInMs)(10)) {
    const cachedBacking = await getCachedBacking(identifier, timestamp, threshold);
    return cachedBacking != null;
}
exports.hasCachedBacking = hasCachedBacking;
//# sourceMappingURL=cache.js.map