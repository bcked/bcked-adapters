import { parse, stringify } from "csv";
import { CastingContext } from "csv-parse";
import { parse as parseSync } from "csv/sync";
import { flatten, unflatten } from "flat"; // Serialize nested data structures

import fs from "fs";

import _ from "lodash";
import { Readable } from "stream";
import { concat, sortWithoutIndex } from "./array";
import { ensurePath, readFirstLine, readLastLines } from "./files";
import { getDateParts, isCloser } from "./time";

import { pipeline } from "stream/promises";
import { getFirstElement } from "./stream";

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

/**
 * Counts the number of rows in a CSV file, excluding the header.
 *
 * @param pathToFile - The path to the CSV file.
 * @returns A promise that resolves to the number of rows in the file.
 */
async function countRows(pathToFile: string): Promise<number> {
    // TODO still needed?
    const stream = fs.createReadStream(pathToFile);
    let linesCount = 0;
    let endedWithLineBreak = false;

    for await (const chunk of stream) {
        const chunkString = chunk.toString();
        endedWithLineBreak = chunkString.endsWith("\n");
        // Count the line breaks in the current chunk of data
        linesCount += (chunkString.match(/\n/g) || []).length;
    }

    if (!endedWithLineBreak) {
        // Add 1 if the file didn't end with a line break
        linesCount += 1;
    }

    return linesCount - 1; // Don't count the header
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
 * Asynchronously reads a CSV file and yields each row along with its index and total number of rows.
 * @template T The type of data in each row.
 * @param pathToFile The path to the CSV file.
 * @returns {AsyncGenerator<{ data: T; index: number; total: number }>} An async generator that yields each row along with its index and total number of rows.
 */
export async function* readCSVWithMeta<T>(
    pathToFile: string
): AsyncGenerator<{ row: T; index: number; total: number }> {
    // TODO still needed?
    const total = await countRows(pathToFile);
    let index = 0;
    for await (const row of readCSV<T>(pathToFile)) {
        yield { row, index, total };
        index++;
    }
}

export async function* readCSVForDates<T extends { timestamp: primitive.ISODateTimeString }>(
    pathToFile: string,
    filter: primitive.DateParts
): AsyncGenerator<T> {
    // TODO still needed?
    for await (const data of readCSV<T>(pathToFile)) {
        const parts = getDateParts(data.timestamp);
        if (
            Object.keys(filter)
                .map((key) => key as "year" | "month" | "day" | "hour")
                .every((key) => Number(filter[key]) === Number(parts[key]))
        ) {
            yield data;
        }
    }
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

    const newHeaders = _.xor(header, existingHeader);

    // If no new headers, return
    if (!newHeaders.length) return header;

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
