"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniformity = exports.round = exports.zScoreNorm = exports.minMaxNorm = exports.rate = exports.median = void 0;
const _ = require("lodash");
function median(arr) {
    if (!arr.length)
        return undefined;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}
exports.median = median;
/** Calculate rate of change with respect to previous value. */
function rate(prev, cur) {
    if (prev === 0 || prev === cur)
        return 0;
    return (cur - prev) / prev;
}
exports.rate = rate;
/** Perform min-max normalization. */
function minMaxNorm(value, min, max) {
    return (value - min) / (max - min);
}
exports.minMaxNorm = minMaxNorm;
/** Perform z-score normalization. */
function zScoreNorm(value, avg, std) {
    return (value - avg) / std;
}
exports.zScoreNorm = zScoreNorm;
/**
 * Round half away from zero ('commercial' rounding)
 * Uses correction to offset floating-point inaccuracies.
 * Works symmetrically for positive and negative numbers.
 * Meaning, that +0.5 will round up and -0.5 will round down.
 * Common rounding always rounds up.
 */
function round(num, decimalPlaces = 0) {
    const p = Math.pow(10, decimalPlaces);
    const n = num * p * (1 + Number.EPSILON);
    return Math.round(n) / p;
}
exports.round = round;
/**
 * [Kullback–Leibler divergence](https://en.wikipedia.org/wiki/Kullback%E2%80%93Leibler_divergence).
 */
function klDivergence(p, q) {
    // Check if the arrays have the same length
    if (p.length !== q.length) {
        throw new Error("The arrays must have the same length");
    }
    // Initialize a variable to store the result
    let result = 0;
    // Loop through each element of the arrays
    for (let i = 0; i < p.length; i++) {
        // Check if the probabilities are valid (between 0 and 1)
        if (p[i] < 0 || p[i] > 1 || q[i] < 0 || q[i] > 1) {
            throw new Error("The probabilities must be between 0 and 1");
        }
        // Check if the probabilities are nonzero
        if (p[i] > 0 && q[i] > 0) {
            // Add the contribution of this element to the result
            result += p[i] * Math.log(p[i] / q[i]);
        }
    }
    return result;
}
/**
 * [Jensen–Shannon divergence](https://en.wikipedia.org/wiki/Jensen%E2%80%93Shannon_divergence).
 */
function jsDivergence(p, q) {
    const m = _.zip(p, q).map((values) => _.mean(values));
    return _.mean([klDivergence(p, m), klDivergence(q, m)]);
}
function jsDistance(p, q) {
    return Math.sqrt(jsDivergence(p, q));
}
/**
 * Measure the uniformity of the provided values.
 * Results have a precision of 4 decimals in the range [0, 1].
 */
function uniformity(values) {
    if (!values.length || [0, 1].includes(values.length))
        return 1;
    const sum = _.sum(values);
    if (sum == 0)
        return 1;
    const valuePercentages = values.map((v) => v / sum);
    const uniformDistribution = Array(values.length).fill(1 / values.length);
    return 1 - jsDistance(valuePercentages, uniformDistribution);
}
exports.uniformity = uniformity;
//# sourceMappingURL=math.js.map