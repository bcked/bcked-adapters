"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hoursInMs = exports.minInMs = exports.secInMs = void 0;
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
//# sourceMappingURL=time.js.map