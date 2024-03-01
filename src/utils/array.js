"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservoirSampler = exports.concat = exports.isAsyncIterator = exports.enumerate = exports.combinations = exports.cycleIndex = exports.toAsync = exports.fromAsync = exports.sortWithoutIndex = exports.groupWhile = exports.generate = exports.uniqueTimesWithInHours = exports.uniqueTimesWithInMs = exports.relativeInMonths = exports.relativeInDays = exports.relativeInHours = exports.relativeInMs = exports.closest = void 0;
const lodash_1 = __importDefault(require("lodash"));
const mersenne_twister_1 = __importDefault(require("mersenne-twister"));
const math_1 = require("./math");
const string_formatting_1 = require("./string_formatting");
const SECOND_IN_MS = 1000;
const MINUTE_IN_MS = 60 * SECOND_IN_MS;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const MONTH_IN_MS = 30 * DAY_IN_MS;
/** Get the closest element in time. */
function closest(array, timestamp) {
    return lodash_1.default.minBy(array, (item) => {
        return Math.abs(new Date(item.timestamp).getTime() - new Date(timestamp).getTime());
    });
}
exports.closest = closest;
// TODO Write binary search -> always splitting search space in half. This makes use of the sorted array.
// export function closest<T extends { timestamp: string }>(array: T[], timestamp: string): T {
// 	let left = 0;
// 	let right = array.length - 1;
// 	let mid = 0;
// 	while (left <= right) {
//      // TODO could probably use heuristic to estimate a better middle
//      // Check were relative to left and right the timestamp is and choose middle respectively
// 		const mid = Math.floor((left + right) / 2);
// 		const midTimestamp = array[mid]!.timestamp;
// 		// If we find an exact match, return immediately
// 		if (midTimestamp === timestamp) break;
// 		if (mid === left || mid === right) {
// 			const t = new Date(timestamp).getTime();
// 			const ldiff = new Date(array[left]!.timestamp).getTime() - t;
// 			const rdiff = new Date(array[right]!.timestamp).getTime() - t;
// 			return ldiff < rdiff ? array[left]! : array[right]!;
// 		}
// 		if (midTimestamp < timestamp) {
// 			// If the middle element is too early, search the right half
// 			left = mid;
// 		} else {
// 			// If the middle element is too late, search the left half
// 			right = mid;
// 		}
// 	}
// 	return array[mid]!;
// }
/** Get element in an interval in ms relative to the latest element. */
function relativeInMs(array, interval, deviation) {
    if (array.length == 0)
        return undefined;
    const relativeTime = new Date(array.at(-1).timestamp).getTime() - interval;
    const elem = closest(array, new Date(relativeTime).toISOString());
    if (Math.abs(new Date(elem.timestamp).getTime() - relativeTime) > interval * deviation)
        return undefined;
    return elem;
}
exports.relativeInMs = relativeInMs;
function relativeInHours(array, interval, deviation = 0.1) {
    return relativeInMs(array, interval * HOUR_IN_MS, deviation);
}
exports.relativeInHours = relativeInHours;
function relativeInDays(array, interval, deviation = 0.1) {
    return relativeInMs(array, interval * DAY_IN_MS, deviation);
}
exports.relativeInDays = relativeInDays;
function relativeInMonths(array, interval, deviation = 0.1) {
    return relativeInMs(array, interval * MONTH_IN_MS, deviation);
}
exports.relativeInMonths = relativeInMonths;
/** Get a list of unique time strings within a specified range in milliseconds. */
function uniqueTimesWithInMs(timestamps, withIn) {
    const roundedTimestamps = timestamps.map((timestamp) => (0, string_formatting_1.toISOString)((0, math_1.round)(new Date(timestamp).getTime() / withIn) * withIn));
    const uniqueList = [...new Set(roundedTimestamps)].sort();
    return uniqueList;
}
exports.uniqueTimesWithInMs = uniqueTimesWithInMs;
/** Get a list of unique time strings within a specified range in milliseconds. */
function uniqueTimesWithInHours(timestamps, withIn = 1) {
    return uniqueTimesWithInMs(timestamps, withIn * HOUR_IN_MS);
}
exports.uniqueTimesWithInHours = uniqueTimesWithInHours;
/** Generate array of numbers between min and max value. */
function generate(min, max, n) {
    const interval = (max - min) / (n - 1);
    const initial = new Array(n).fill(min);
    return initial.map((value, index) => index * interval + value);
}
exports.generate = generate;
function groupWhile(array, condition) {
    const groups = [];
    const popArray = lodash_1.default.cloneDeep(array).reverse(); // reverse so that we can use pop for a better efficiency
    let bufferArray = [];
    while (popArray.length > 0) {
        const item = popArray.pop();
        if (condition([...bufferArray, item])) {
            bufferArray = [...bufferArray, item];
        }
        else if (condition([item])) {
            groups.push(bufferArray);
            bufferArray = [item];
        }
        else {
            console.log(`Item ${item} did not match condition and was discarded.`);
            continue;
        }
    }
    groups.push(bufferArray);
    return groups;
}
exports.groupWhile = groupWhile;
function sortWithoutIndex(array, index) {
    return lodash_1.default.concat(index, lodash_1.default.without(array, index).sort());
}
exports.sortWithoutIndex = sortWithoutIndex;
async function fromAsync(iter) {
    const out = [];
    for await (const item of iter) {
        out.push(item);
    }
    return out;
}
exports.fromAsync = fromAsync;
async function* toAsync(arr) {
    for (const item of arr) {
        yield item;
    }
}
exports.toAsync = toAsync;
/**
 * Generates an infinite sequence of indices within the specified bounds, starting from a given index and with a specified step.
 * @param bounds - The lower and upper bounds of the index range.
 * @param start - The starting index (default: 0).
 * @param step - The step size between indices (default: 1).
 * @throws Error if the starting index is outside the bounds or if the step size is larger than the range of bounds.
 * @returns An iterable iterator that generates the indices.
 */
function* cycleIndex(bounds, start = 0, step = 1) {
    const [lower, upper] = bounds;
    if (start < lower || start > upper)
        throw Error(`Start ${start} outside bounds ${bounds}.`);
    if (step > upper - lower)
        throw Error(`Step larger than range of bounds ${bounds}.`);
    let index = start;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
        yield index;
        index += step;
        if (index < lower) {
            // Stepped outside on the lower end. Reenter on the upper.
            index = upper;
        }
        else if (index > upper) {
            // Stepped outside on the upper end. Reenter on the lower.
            index = lower;
        }
    }
}
exports.cycleIndex = cycleIndex;
/**
 * Generates combinations of elements from multiple async iterables.
 *
 * @template T - The type of elements in the iterables.
 * @param lists - An array of async iterables.
 * @param index - The current index in the iteration (default: 0).
 * @param current - The current combination of elements (default: []).
 * @returns An async iterable that yields combinations of elements.
 */
async function* combinations(lists, index = 0, current = []) {
    if (index === lists.length) {
        yield current;
        return;
    }
    for await (const item of lists[index]) {
        yield* combinations(lists, index + 1, [...current, item]);
    }
}
exports.combinations = combinations;
/**
 * The enumerate method adds a counter to an iterable and returns it in the form of an enumerating object.
 * @param items The async iterable to enumerate.
 * @param start The index to start with.
 * @returns Returns an iterator with index and element pairs from the original iterable.
 */
async function* enumerate(items, start = 0) {
    let index = start;
    for await (const item of items) {
        yield [index, item];
        index++;
    }
}
exports.enumerate = enumerate;
function isAsyncIterator(obj) {
    if (Object(obj) !== obj)
        return false;
    const method = obj[Symbol.asyncIterator];
    if (typeof method != "function")
        return false;
    const aIter = method.call(obj);
    return aIter === obj;
}
exports.isAsyncIterator = isAsyncIterator;
async function* concat(...iterables) {
    for (const iterable of iterables) {
        if (isAsyncIterator(iterable)) {
            yield* iterable;
        }
        else {
            yield iterable;
        }
    }
}
exports.concat = concat;
/**
 * ReservoirSampler is a class that implements the reservoir sampling algorithm.
 * It is used to randomly select a fixed-size sample from a stream of elements.
 * The algorithm ensures that each element in the stream has an equal probability of being selected.
 *
 * @template T The type of elements in the reservoir.
 */
class ReservoirSampler {
    constructor(size) {
        this.size = size;
        this.reservoir = [];
        this.count = 0;
        this.generator = new mersenne_twister_1.default(1234567890);
    }
    insert(value) {
        this.count++;
        if (this.reservoir.length < this.size) {
            this.reservoir.push(value);
        }
        else {
            const index = Math.floor(this.generator.random() * this.count);
            // Items are inserted with a decreasing probability
            if (index < this.size) {
                this.reservoir[index] = value;
            }
        }
    }
    get values() {
        return this.reservoir;
    }
}
exports.ReservoirSampler = ReservoirSampler;
//# sourceMappingURL=array.js.map