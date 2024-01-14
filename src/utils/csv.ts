import { parse, stringify } from "csv";
import { CastingContext } from "csv-parse";
import { parse as parseSync } from "csv/sync";
import { flatten, unflatten } from "flat"; // Serialize nested data structures

import fs from "fs";
import _ from "lodash";

import { enumerate, sortWithoutIndex } from "./array";
import { ensurePath, readFirstLine, readLastLines } from "./files";
import { getDateParts, isCloser } from "./time";

/**
 * Read the headers of a CSV file.
 * @param pathToFile The file path to the file to be read.
 * @returns The headers in an array.
 */
export async function readHeaders(pathToFile: string): Promise<string[]> {
    const line = await readFirstLine(pathToFile);
    return parseSync(line)[0];
}

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
    const parser = parse({ columns: true, cast: castNumbers });
    const stream = fs.createReadStream(pathToFile).pipe(parser);

    for await (const row of stream) {
        yield unflatten(row);
    }
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

export async function rewriteCSV(pathToFile: string, targetHeader: string[]) {
    const parser = parse({ columns: true });
    const stringifier = stringify({ header: true, columns: targetHeader });

    const tempPath = pathToFile.replace(".csv", "_temp.csv");

    const writeStream = fs.createWriteStream(tempPath, {
        encoding: "utf-8",
    });

    await new Promise((resolve, reject) => {
        fs.createReadStream(pathToFile)
            .on("error", reject)
            .pipe(parser)
            .pipe(stringifier)
            .pipe(writeStream)
            .on("error", reject)
            .on("finish", resolve);
    });

    await fs.promises.rename(tempPath, pathToFile);
}

export async function writeToCsv(
    pathToFile: string,
    rows: AsyncIterableIterator<object>,
    index?: string
) {
    await ensurePath(pathToFile);

    const writableStream = fs.createWriteStream(pathToFile, {
        flags: "a",
        encoding: "utf-8",
    });
    let stringifier;

    for await (const [i, row] of enumerate(rows)) {
        const rowFlattened = flatten<object, object>(row);
        if (i === 0) {
            // Ensure header consistency
            let header = Object.keys(rowFlattened);
            // By default, take first key as index
            const headerIndex = index ?? header[0]!;

            const exists = fs.existsSync(pathToFile);
            if (exists) {
                const existingHeader = await readHeaders(pathToFile);
                const newHeaders = _.difference(header, existingHeader);

                // Get combined header
                header = sortWithoutIndex(_.union(existingHeader, header), headerIndex);

                if (newHeaders.length) {
                    // Rewrite CSV to fill old entries for new headers
                    await rewriteCSV(pathToFile, header);
                }
            }

            stringifier = stringify({
                header: !exists, // Don't write the header on append
                columns: sortWithoutIndex(header, headerIndex),
            });
            stringifier.pipe(writableStream);
        }

        stringifier!.write(rowFlattened);
    }

    stringifier!.end();
}
