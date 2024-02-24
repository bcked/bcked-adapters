import { parse, stringify } from "csv";
import { CastingContext } from "csv-parse";
import { parse as parseSync } from "csv/sync";
import { flatten, unflatten } from "flat"; // Serialize nested data structures

import fs from "fs";

import _ from "lodash";
import { Readable } from "stream";
import { concat, sortWithoutIndex } from "./array";
import { ensurePath, readFirstLine, readLastLines } from "./files";
import { isCloser } from "./time";

import { hoursToMilliseconds } from "date-fns";
import { pipeline } from "stream/promises";
import { getFirstElement } from "./stream";
import { distance, isNewer } from "./time";

function castNumbers(value: string, context: CastingContext): string | number {
    if (context.header) return value;

    if (value == "") return value;

    try {
        const asNumber = Number(value);
        if (!isNaN(asNumber)) return asNumber;
    } catch {
        return value;
    }

    return value;
}

/**
 * Read the last entry of a CSV file.
 * @param pathToFile The file path to the file to be read.
 * @returns The last entry of the CSV as an object.
 */
export async function readLastEntry<T extends object>(pathToFile: string): Promise<T> {
    const lines = await Promise.all([readFirstLine(pathToFile), readLastLines(pathToFile, 1)]);
    return unflatten(parseSync(lines.join("\n"), { columns: true, cast: castNumbers })[0]);
}

export async function readClosestEntry<T extends object & { timestamp: primitive.DateLike }>(
    pathToFile: string,
    timestamp: primitive.DateLike
): Promise<T | null> {
    let closest: T | null = null;
    const parser = fs.createReadStream(pathToFile).pipe(
        parse({
            columns: true,
            cast: castNumbers,
        })
    );
    for await (const record of parser) {
        if (closest == null || isCloser(timestamp, record.timestamp, closest.timestamp)) {
            closest = record;
        } else {
            // This expects the entries in the CSV to be sorted by timestamp.
            break;
        }
    }
    return unflatten(closest);
}

export async function* readCSV<T>(pathToFile: string): AsyncGenerator<T> {
    const stream = fs.createReadStream(pathToFile).pipe(
        parse({
            columns: true,
            cast: castNumbers,
            skipEmptyLines: true,
            skipRecordsWithError: true,
        })
    );

    for await (const row of stream) {
        yield unflatten(row);
    }
}

async function readHeadersFromStream<T>(
    rows: AsyncIterable<T>
): Promise<[AsyncGenerator<T, void, undefined>, string[]] | [undefined, undefined]> {
    // Read the first row to get the header
    const [value, _rows] = await getFirstElement(rows);
    if (!value || !_rows) return [undefined, undefined];

    const rowFlattened = flatten<object, object>(value);
    // Ensure header consistency
    let header = Object.keys(rowFlattened);
    return [concat(value, _rows), header];
}

/**
 * Change the header of a CSV file.
 * @param pathToFile The path to the CSV file.
 * @param header The new header to be written to the CSV file.
 */
export async function rewriteCSV<T>(
    pathToFile: string,
    header: string[],
    readStream: AsyncIterable<T> | undefined = undefined
) {
    if (!readStream) {
        readStream = readCSV(pathToFile);
    }

    const stringifier = stringify({ header: true, columns: header });

    const tempPath = pathToFile.replace(".csv", "_temp.csv");

    const writeStream = fs.createWriteStream(tempPath, {
        encoding: "utf-8",
    });

    await pipeline(readStream, stringifier, writeStream);

    await fs.promises.rename(tempPath, pathToFile);
}

export async function writeToCsv<T>(pathToFile: string, rows: AsyncIterable<T>, index?: string) {
    let [_rows, header] = await readHeadersFromStream(rows);
    if (!_rows || !header) return;

    // By default, take first key as index
    const headerIndex = index ?? header[0]!;

    header = sortWithoutIndex(header, headerIndex);

    await appendCsv(pathToFile, _rows, header);
}

export async function ensureSameHeader(pathToFile: string, header: string[]) {
    const csvStream = readCSV(pathToFile);
    const [rows, existingHeader] = await readHeadersFromStream(csvStream);

    if (!existingHeader) return header;

    const newHeaders = _.difference(header, existingHeader);

    // If no new headers, return the existing headers
    if (!newHeaders.length) return existingHeader;

    // Get combined header
    const combinedHeader = sortWithoutIndex(_.union(existingHeader, header), header[0]!);

    // Rewrite CSV to fill old entries for new headers
    await rewriteCSV(pathToFile, combinedHeader, rows);

    return combinedHeader;
}

export async function appendCsv<T>(pathToFile: string, rows: AsyncIterable<T>, header: string[]) {
    const exists = fs.existsSync(pathToFile);

    if (exists) {
        header = await ensureSameHeader(pathToFile, header);
    } else {
        await ensurePath(pathToFile);
    }

    const rowsReadable = Readable.from(rows);

    const stringifier = stringify({
        header: !exists, // Don't write the header on append
        columns: header,
    });

    const writeStream = fs.createWriteStream(pathToFile, {
        flags: "a",
    });

    await pipeline(rowsReadable, stringifier, writeStream);
}

export async function createCsv<T>(pathToFile: string, rows: AsyncIterable<T>, header: string[]) {
    await ensurePath(pathToFile);

    const rowsReadable = Readable.from(rows);

    const stringifier = stringify({
        header: true, // Don't write the header on append
        columns: header,
    });

    const writableStream = fs.createWriteStream(pathToFile, {
        flags: "w",
    });

    await pipeline(rowsReadable, stringifier, writableStream);
}

export class ConsecutiveLookup<T extends primitive.Timestamped> {
    private readonly values: Map<string, T> = new Map();
    private readonly csvStream: AsyncGenerator<T>;
    private done: boolean = false;
    private lastTimestamp: string | undefined = undefined;

    constructor(public readonly csvPath: string) {
        this.csvStream = readCSV<T>(csvPath);
    }

    public async getClosest(
        timestamp: primitive.DateLike,
        window: number = hoursToMilliseconds(12)
    ): Promise<T | undefined> {
        // Read new values from csvStream and store them in the values map
        while (
            !this.done && // Stop if the csvStream is done
            (!this.lastTimestamp || !isNewer(timestamp, this.lastTimestamp, window)) // Read ahead the specified time window
        ) {
            const { value, done } = await this.csvStream.next();
            this.done = done!;

            if (!value) break;

            this.values.set(value.timestamp, value);

            this.lastTimestamp = value.timestamp;
        }

        // Find the best match in the values cache
        let bestMatch: T | undefined;
        let bestDistance: number | undefined;
        for (const value of this.values.values()) {
            // Ignore and delete entries older than time window
            if (isNewer(value.timestamp, timestamp, window)) {
                this.values.delete(value.timestamp);
                continue;
            }

            const timeDistance = distance(timestamp, value.timestamp);
            if (!bestDistance || timeDistance < bestDistance) {
                bestMatch = value;
                bestDistance = timeDistance;
            } else {
                break; // Values are sorted, so we can stop here.
            }
        }

        return bestMatch;
    }
}
