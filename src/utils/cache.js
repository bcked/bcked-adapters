"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasCachedBacking = exports.getCachedBacking = exports.hasCachedSupply = exports.getCachedSupply = exports.hasCachedPrice = exports.getCachedPrice = exports.hasCached = exports.getCached = void 0;
const fs = require("fs");
const helper_1 = require("./helper");
const csv_1 = require("./primitive/csv");
const time_1 = require("./primitive/time");
async function getCached(pathToFile, threshold = (0, time_1.minInMs)(10)) {
    if (!fs.existsSync(pathToFile))
        return null;
    const data = await (0, csv_1.readLastEntry)(pathToFile);
    const duration = Date.now() - new Date(data.timestamp).getTime();
    if (duration > threshold)
        return null;
    return data;
}
exports.getCached = getCached;
async function hasCached(pathToFile, threshold = (0, time_1.minInMs)(10)) {
    const cached = await getCached(pathToFile, threshold);
    return cached != null;
}
exports.hasCached = hasCached;
async function getCachedPrice(identifier, threshold = (0, time_1.minInMs)(10)) {
    return getCached((0, helper_1.getPriceCsvPath)(identifier), threshold);
}
exports.getCachedPrice = getCachedPrice;
async function hasCachedPrice(identifier, threshold = (0, time_1.minInMs)(10)) {
    const cachedPrice = await getCachedPrice(identifier, threshold);
    return cachedPrice != null;
}
exports.hasCachedPrice = hasCachedPrice;
async function getCachedSupply(identifier, threshold = (0, time_1.minInMs)(10)) {
    return getCached((0, helper_1.getSupplyCsvPath)(identifier), threshold);
}
exports.getCachedSupply = getCachedSupply;
async function hasCachedSupply(identifier, threshold = (0, time_1.minInMs)(10)) {
    const cachedSupply = await getCachedSupply(identifier, threshold);
    return cachedSupply != null;
}
exports.hasCachedSupply = hasCachedSupply;
async function getCachedBacking(identifier, threshold = (0, time_1.minInMs)(10)) {
    return getCached((0, helper_1.getBackingCsvPath)(identifier), threshold);
}
exports.getCachedBacking = getCachedBacking;
async function hasCachedBacking(identifier, threshold = (0, time_1.minInMs)(10)) {
    const cachedBacking = await getCachedBacking(identifier, threshold);
    return cachedBacking != null;
}
exports.hasCachedBacking = hasCachedBacking;
//# sourceMappingURL=cache.js.map