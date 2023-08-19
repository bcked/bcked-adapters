"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClosest = exports.getLatest = void 0;
const fs_1 = __importDefault(require("fs"));
const csv_1 = require("../primitive/csv");
const time_1 = require("./time");
async function getLatest(pathToFile) {
    if (!fs_1.default.existsSync(pathToFile))
        return null;
    return await (0, csv_1.readLastEntry)(pathToFile);
}
exports.getLatest = getLatest;
async function getClosest(pathToFile, timestamp, threshold) {
    if (!fs_1.default.existsSync(pathToFile))
        return null;
    const closest = await (0, csv_1.readClosestEntry)(pathToFile, timestamp);
    if (threshold !== undefined &&
        closest !== null &&
        !(0, time_1.isClose)(timestamp, closest.timestamp, threshold)) {
        // If it doesn't match the threshold, return null.
        return null;
    }
    return closest;
}
exports.getClosest = getClosest;
//# sourceMappingURL=cache.js.map