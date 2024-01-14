import { hoursToMilliseconds } from "date-fns";
import _ from "lodash";
import MersenneTwister from "mersenne-twister";
import { inverse, round } from "./math";
import { toISOString } from "./string_formatting";
import { duration, isNewer, maxDistance, minDate, totalDistance } from "./time";

const SECOND_IN_MS = 1000;
const MINUTE_IN_MS = 60 * SECOND_IN_MS;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const MONTH_IN_MS = 30 * DAY_IN_MS;

/** Get the closest element in time. */
export function closest<T extends { timestamp: string }>(array: T[], timestamp: string): T {
    return _.minBy(array, (item) => {
        return Math.abs(new Date(item.timestamp).getTime() - new Date(timestamp).getTime());
    })!;
}

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
export function relativeInMs<T extends { timestamp: string }>(
    array: T[],
    interval: number,
    deviation: number
): T | undefined {
    if (array.length == 0) return undefined;

    const relativeTime = new Date(array.at(-1)!.timestamp).getTime() - interval;

    const elem = closest(array, new Date(relativeTime).toISOString());

    if (Math.abs(new Date(elem.timestamp).getTime() - relativeTime) > interval * deviation)
        return undefined;

    return elem;
}

export function relativeInHours<T extends { timestamp: string }>(
    array: T[],
    interval: number,
    deviation = 0.1
): T | undefined {
    return relativeInMs(array, interval * HOUR_IN_MS, deviation);
}

export function relativeInDays<T extends { timestamp: string }>(
    array: T[],
    interval: number,
    deviation = 0.1
): T | undefined {
    return relativeInMs(array, interval * DAY_IN_MS, deviation);
}

export function relativeInMonths<T extends { timestamp: string }>(
    array: T[],
    interval: number,
    deviation = 0.1
): T | undefined {
    return relativeInMs(array, interval * MONTH_IN_MS, deviation);
}

/** Get a list of unique time strings within a specified range in milliseconds. */
export function uniqueTimesWithInMs(
    timestamps: primitive.ISODateTimeString[],
    withIn: number
): primitive.ISODateTimeString[] {
    const roundedTimestamps = timestamps.map((timestamp) =>
        toISOString(round(new Date(timestamp).getTime() / withIn) * withIn)
    );
    const uniqueList = [...new Set(roundedTimestamps)].sort();
    return uniqueList;
}

/** Get a list of unique time strings within a specified range in milliseconds. */
export function uniqueTimesWithInHours(
    timestamps: primitive.ISODateTimeString[],
    withIn = 1
): primitive.ISODateTimeString[] {
    return uniqueTimesWithInMs(timestamps, withIn * HOUR_IN_MS);
}

/** Generate array of numbers between min and max value. */
export function generate(min: number, max: number, n: number): number[] {
    const interval = (max - min) / (n - 1);
    const initial = new Array(n).fill(min);
    return initial.map((value, index) => index * interval + value);
}

export function groupWhile<T>(array: T[], condition: (group: T[]) => boolean) {
    const groups: T[][] = [];
    const popArray: T[] = _.cloneDeep(array).reverse(); // reverse so that we can use pop for a better efficiency
    let bufferArray: T[] = [];
    while (popArray.length > 0) {
        const item = popArray.pop()!;
        if (condition([...bufferArray, item])) {
            bufferArray = [...bufferArray, item];
        } else if (condition([item])) {
            groups.push(bufferArray);
            bufferArray = [item];
        } else {
            console.log(`Item ${item} did not match condition and was discarded.`);
            continue;
        }
    }
    groups.push(bufferArray);
    return groups;
}

export function sortWithoutIndex(array: string[], index: string): string[] {
    return _.concat(index, _.without(array, index).sort());
}

export async function fromAsync<T>(iter: AsyncIterableIterator<T>): Promise<T[]> {
    const out: T[] = [];
    for await (const item of iter) {
        out.push(item);
    }
    return out;
}

export async function* toAsync<T>(arr: Iterable<T>): AsyncIterableIterator<T> {
    for (const item of arr) {
        yield item;
    }
}

/**
 * Read time series entries with timestamps of multiple lists with dynamically adjusted read speed.
 *
 * The lists are required to be sorted based on the timestamp, starting with the oldest.
 *
 * @param lists
 */
export async function* readTimeSeries<T extends { timestamp: primitive.DateLike }>(
    lists: AsyncIterableIterator<T>[],
    resolutionUpdateWeight = 0.9
): AsyncIterableIterator<{ index: number; item: T }> {
    let resolutionAvg: number[] = Array(lists.length).fill(hoursToMilliseconds(1)); // Start with equal weighting
    let moreEntries: boolean[] = Array(lists.length);
    let latestEntries: number[] = Array(lists.length); // Read head of the latest timestamps in MS
    do {
        // Compute ratio between average resolutions to dynamically adjust iteration speed for each list (lower bound by 1)
        const minRes = _.min(resolutionAvg)!;
        // There is an inverse relation between duration and ratio. The smaller the duration, the larger the batch should be.
        const resolutionRatio = inverse(
            resolutionAvg.map((avg) => Math.max(Math.floor(avg / minRes), 1))
        );

        for (const [index, list] of lists.entries()) {
            for (let i = 0; i < resolutionRatio[index]!; i++) {
                const { value: item, done } = await list.next();
                moreEntries[index] = !done!;

                if (done) break;

                yield { index, item };

                if (latestEntries[index] != undefined) {
                    const currentDuration = duration(item.timestamp, latestEntries[index]!);
                    resolutionAvg[index] =
                        resolutionUpdateWeight * resolutionAvg[index]! +
                        (1.0 - resolutionUpdateWeight) * currentDuration;
                }
                latestEntries[index] = new Date(item.timestamp).getTime();
            }
        }
    } while (moreEntries.includes(true));
}

export function* cycleIndex(
    bounds: [number, number],
    start: number = 0,
    step: number = 1
): IterableIterator<number> {
    const [lower, upper] = bounds;
    if (start < lower || start > upper) throw Error(`Start ${start} outside bounds ${bounds}.`);
    if (step > upper - lower) throw Error(`Step larger than range of bounds ${bounds}.`);
    let index = start;
    while (true) {
        yield index;
        index += step;
        if (index < lower) {
            // Stepped outside on the lower end. Reenter on the upper.
            index = upper;
        } else if (index > upper) {
            // Stepped outside on the upper end. Reenter on the lower.
            index = lower;
        }
    }
}

function valueIterator<T>(iterator: IterableIterator<T>): { next: () => T } {
    return {
        next() {
            const { value } = iterator.next();
            return value;
        },
    };
}

function asyncValueIterator<T>(iterator: AsyncIterableIterator<T>): { next: () => Promise<T> } {
    return {
        async next() {
            const { value } = await iterator.next();
            return value;
        },
    };
}

/**
 * Read time series entries with timestamps of multiple lists with dynamically adjusted read speed.
 *
 * The lists are required to be sorted based on the timestamp, starting with the oldest.
 *
 * @param lists
 */
export async function* readTimeSeriesByWindow<T extends { timestamp: primitive.DateLike }>(
    lists: AsyncIterableIterator<T>[],
    window: number = hoursToMilliseconds(12)
): AsyncIterableIterator<{ index: number; item: T }> {
    let moreEntries: boolean[] = Array(lists.length);
    let latestTimestamps: primitive.DateLike[] = Array(lists.length); // Read head of the latest timestamps in MS

    // Cycle through the index backwards, starting with the first index to get it populated.
    const indexIterator = valueIterator(cycleIndex([0, lists.length - 1], 0, -1));
    const seriesIterators = lists.map(asyncValueIterator);

    let index = indexIterator.next();
    do {
        const item = await seriesIterators[index]!.next();

        moreEntries[index] = item != undefined;
        if (!item) {
            index = indexIterator.next();
            continue; // If done, there is no item.
        }

        yield { index, item };

        latestTimestamps[index] = item.timestamp;

        if (index == 0 || isNewer(latestTimestamps[0]!, latestTimestamps[index]!, window)) {
            // Do not iterate multiple times for the first index.
            index = indexIterator.next();
            continue;
        }
    } while (moreEntries.includes(true));
}

export async function* combinations<T>(
    lists: AsyncIterableIterator<T>[],
    index = 0,
    current: T[] = []
): AsyncIterableIterator<T[]> {
    if (index === lists.length) {
        yield current;
        return;
    }

    for await (const item of lists[index]!) {
        yield* combinations(lists, index + 1, [...current, item]);
    }
}

/**
 * Read time series entries with timestamps of multiple lists with dynamically adjusted read speed.
 *
 * The lists are required to be sorted based on the timestamp, starting with the oldest.
 *
 * @param lists
 */
export async function* combinationsForTimeWindow<T extends { timestamp: primitive.DateLike }>(
    indexedEntries: AsyncIterableIterator<{ index: number; item: T }>,
    length: number,
    window: number = hoursToMilliseconds(12)
): AsyncIterableIterator<T[]> {
    let cache: T[][] = _.map(Array(length), () => []); // this is needed like that to create independent list instances

    for await (const { index, item } of indexedEntries) {
        let lastEntries = cache.map((list) => list.at(-1));
        lastEntries[index] = item;
        const minTimeOfLatestsEntries = toISOString(minDate(lastEntries, "timestamp")!); // TODO remove toIsoString again, added just for test purpose

        // When latest entries are newer than the time window, remove respective items from the cache.
        for (const list of cache) {
            let removeIndex: number | undefined = undefined;
            for (const [cacheIndex, entry] of list.entries()) {
                if (!isNewer(minTimeOfLatestsEntries, entry.timestamp, window)) break;
                removeIndex = cacheIndex; // Only find the newest index
            }
            if (removeIndex != undefined) {
                list.splice(0, removeIndex + 1); // Remove from cache
            }
        }

        cache[index]!.push(item);

        // If there aren't items in all lists, continue.
        if (cache.some(_.isEmpty)) continue;

        // Build combinations. For the current index only provide the new item to combine with.
        for await (const combination of combinations(
            cache.map((value, i) => toAsync(i === index ? [item] : value))
        )) {
            if (maxDistance(combination[0]!.timestamp, _.map(combination, "timestamp")) <= window) {
                yield combination;
            }
        }
    }
}

/**
 *
 * @param list List of entries to find the closest. Expect entries to be sorted from left to right.
 */
export function* closestForTimestamps<T extends { timestamp: primitive.DateLike }>(
    list: Array<T[]>
): IterableIterator<{ index: number; match: T[] }> {
    let match: T[] | undefined = undefined;
    let index: number | undefined = undefined;
    for (const [entryIndex, entry] of list.entries()) {
        index = entryIndex;
        const entryTime = entry[0]!.timestamp;

        // If not match is tracked yet, assign and continue.
        if (match == undefined) {
            match = entry;
            continue;
        }

        // If time of first index changed, we don't expect any more closer matches (due to sorting of entries).
        const closestTime = match[0]!.timestamp;
        if (closestTime != entryTime) {
            yield { index, match }; // Yield the closest match
            match = entry; // Continue with new entry
            continue;
        }

        // If current entry is close than current match, take a new match
        if (
            totalDistance(closestTime, _.map(entry, "timestamp")) <
            totalDistance(closestTime, _.map(match, "timestamp"))
        ) {
            match = entry;
            continue;
        }
    }
    // When not yielded yet, yield the closest match
    if (index != undefined && match != undefined) {
        yield { index, match };
    }
}

/**
 * Match entries with timestamps of multiple lists.
 *
 * The lists are required to be sorted based on the timestamp, starting with the oldest.
 *
 * @param lists
 */
export async function* matchOnTimestamp(
    lists: AsyncIterableIterator<{ timestamp: primitive.DateLike }>[],
    window: number = hoursToMilliseconds(12)
): AsyncIterableIterator<{ timestamp: primitive.DateLike }[]> {
    const entries = readTimeSeriesByWindow(lists, window);
    const combinations = combinationsForTimeWindow(entries, lists.length, window);

    let cache = Array<{ timestamp: primitive.DateLike }[]>();

    for await (const combination of combinations) {
        let removeIndex: number | undefined = undefined;
        for (const { index, match } of closestForTimestamps(cache)) {
            if (!isNewer(match[0]!.timestamp, combination[0]!.timestamp!, window)) break;
            yield match;
            removeIndex = index;
        }
        if (removeIndex != undefined) {
            cache.splice(0, removeIndex + 1);
        }
        cache.push(combination);
    }

    // Yield the rest of the matches in cache
    for (const { match } of closestForTimestamps(cache)) {
        yield match;
    }
}

/**
 * The enumerate method adds a counter to an iterable and returns it in the form of an enumerating object.
 * @param items The async iterable to enumerate.
 * @param start The index to start with.
 * @returns Returns an iterator with index and element pairs from the original iterable.
 */
export async function* enumerate<T>(
    items: AsyncIterableIterator<T>,
    start: number = 0
): AsyncIterableIterator<[number, T]> {
    let index = start;
    for await (const item of items) {
        yield [index, item];
        index++;
    }
}

export class ReservoirSampler<T> {
    private reservoir: T[];
    private count: number; // Number of items inserted so far
    private generator: MersenneTwister; // Make sampler deterministic

    constructor(private readonly size: number) {
        this.reservoir = [];
        this.count = 0;
        this.generator = new MersenneTwister(1234567890);
    }

    insert(value: T) {
        this.count++;
        if (this.reservoir.length < this.size) {
            this.reservoir.push(value);
        } else {
            const index = Math.floor(this.generator.random() * this.count);
            // Items are inserted with a decreasing probability
            if (index < this.size) {
                this.reservoir[index] = value;
            }
        }
    }

    get values(): T[] {
        return this.reservoir;
    }
}
