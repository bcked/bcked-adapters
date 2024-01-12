import _, { List, ListIteratee, Many, PropertyPath } from "lodash";

export function statsBy<T>(
    collection: List<T> | null | undefined,
    ...iteratees: Array<Many<ListIteratee<T>>>
): { low: T; median: T; high: T } | null {
    if (!collection?.length) return null;

    const sorted = _.sortBy(collection, ...iteratees);
    const mid = Math.floor(sorted.length / 2);
    return {
        low: sorted.at(0)!,
        median: sorted.at(mid)!,
        high: sorted.at(-1)!,
    };
}

export function medianBy<TObject extends object, TKey extends keyof TObject>(
    collection: TObject[] | null | undefined,
    path: TKey | PropertyPath
): TObject | null {
    if (!collection?.length) return null;

    const sorted = _.sortBy(collection, path);
    const mid = Math.floor(sorted.length / 2);
    return sorted.at(mid)!;
}

export function median(arr: number[]): number | undefined {
    if (!arr.length) return undefined;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 === 0 ? (s[mid - 1]! + s[mid]!) / 2 : s[mid];
}

/** Calculate rate of change with respect to previous value. */
export function rate(prev: number, cur: number): number {
    if (prev === 0 || prev === cur) return 0;
    return (cur - prev) / prev;
}

/** Perform min-max normalization. */
export function minMaxNorm(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
}

/** Perform z-score normalization. */
export function zScoreNorm(value: number, avg: number, std: number): number {
    return (value - avg) / std;
}

/**
 * Round half away from zero ('commercial' rounding)
 * Uses correction to offset floating-point inaccuracies.
 * Works symmetrically for positive and negative numbers.
 * Meaning, that +0.5 will round up and -0.5 will round down.
 * Common rounding always rounds up.
 */
export function round(num: number, decimalPlaces = 0): number {
    const p = Math.pow(10, decimalPlaces);
    const n = num * p * (1 + Number.EPSILON);
    return Math.round(n) / p;
}

/**
 * [Kullback–Leibler divergence](https://en.wikipedia.org/wiki/Kullback%E2%80%93Leibler_divergence).
 */
function klDivergence(p: number[], q: number[]): number {
    // Check if the arrays have the same length
    if (p.length !== q.length) {
        throw new Error("The arrays must have the same length");
    }

    // Initialize a variable to store the result
    let result = 0;

    // Loop through each element of the arrays
    for (let i = 0; i < p.length; i++) {
        // Check if the probabilities are valid (between 0 and 1)
        if (p[i]! < 0 || p[i]! > 1 || q[i]! < 0 || q[i]! > 1) {
            throw new Error("The probabilities must be between 0 and 1");
        }

        // Check if the probabilities are nonzero
        if (p[i]! > 0 && q[i]! > 0) {
            // Add the contribution of this element to the result
            result += p[i]! * Math.log(p[i]! / q[i]!);
        }
    }

    return result;
}

/**
 * [Jensen–Shannon divergence](https://en.wikipedia.org/wiki/Jensen%E2%80%93Shannon_divergence).
 */
function jsDivergence(p: number[], q: number[]): number {
    const m = _.zip(p, q).map((values) => _.mean(values));
    return _.mean([klDivergence(p, m), klDivergence(q, m)]);
}

function jsDistance(p: number[], q: number[]): number {
    return Math.sqrt(jsDivergence(p, q));
}

/**
 * Measure the uniformity of the provided values.
 * Results have a precision of 4 decimals in the range [0, 1].
 */
export function uniformity(values: number[]): number {
    if (!values.length || [0, 1].includes(values.length)) return 1;

    const sum = _.sum(values);
    if (sum == 0) return 1;

    const valuePercentages = values.map((v) => v / sum);
    const uniformDistribution = Array(values.length).fill(1 / values.length);
    return 1 - jsDistance(valuePercentages, uniformDistribution);
}

/**
 * Swap values based on their values.
 *
 * The smallest value should swap place with the largest.
 * The second smallest with the second largest.
 * And so on.
 */
export function inverse(inputList: number[]): number[] {
    // Input example: [8, 5, 30, 1, 70, 4]

    // Create an array of objects to store the original values and indices
    // Example: [{ value: 8, index: 0}, { value: 5, index: 1}, { value: 30, index: 2}, { value: 1, index: 3}, { value: 70, index: 4}, { value: 4, index: 5}]
    const indexedList = inputList.map((value, index) => ({ value, index }));

    // Sort the indexed list by values in ascending order
    // Example: [{ value: 1, index: 3}, { value: 4, index: 5}, { value: 5, index: 1}, { value: 8, index: 0}, { value: 30, index: 2}, { value: 70, index: 4}]
    indexedList.sort((a, b) => a.value - b.value);

    // Write back to index in inverted index order.
    let result = Array(inputList.length);
    for (const [index, item] of indexedList.entries()) {
        result[indexedList[indexedList.length - 1 - index]!.index] = item.value;
    }

    return result;
}
