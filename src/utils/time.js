"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatesBetween = exports.isCloser = exports.isClose = exports.isNewer = exports.duration = exports.daysInMs = exports.hoursInMs = exports.minInMs = exports.secInMs = void 0;
function secInMs(seconds) {
    return seconds * 1000;
}
exports.secInMs = secInMs;
function minInMs(minutes) {
    return secInMs(minutes * 60);
}
exports.minInMs = minInMs;
function hoursInMs(hours) {
    return minInMs(hours * 60);
}
exports.hoursInMs = hoursInMs;
function daysInMs(days) {
    return hoursInMs(days * 24);
}
exports.daysInMs = daysInMs;
function duration(first, second) {
    return new Date(first).getTime() - new Date(second).getTime();
}
exports.duration = duration;
function isNewer(first, second, threshold) {
    return duration(second, first) > threshold;
}
exports.isNewer = isNewer;
function isClose(first, second, threshold) {
    return Math.abs(duration(second, first)) <= threshold;
}
exports.isClose = isClose;
function isCloser(reference, first, second) {
    return Math.abs(duration(reference, first)) < Math.abs(duration(reference, second));
}
exports.isCloser = isCloser;
function* getDatesBetween(start, end, stepSizeInMs) {
    const startTimestamp = new Date(start).getTime();
    const endTimestamp = new Date(end).getTime();
    for (let timestamp = startTimestamp + stepSizeInMs; timestamp <= endTimestamp; timestamp += stepSizeInMs) {
        yield new Date(timestamp);
    }
}
exports.getDatesBetween = getDatesBetween;
//# sourceMappingURL=time.js.map