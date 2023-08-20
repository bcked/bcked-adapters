import { parse, stringify } from "csv";
import { CastingContext } from "csv-parse";
import { parse as parseSync } from "csv/sync";

import fs from "fs";
import _ from "lodash";

import { sortWithoutIndex } from "./array";
import { ensurePath, readFirstLine, readLastLines } from "./files";
import { isCloser } from "./time";

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
    return parseSync(lines.join("\n"), { columns: true, cast: castNumbers })[0];
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
    return closest;
}

export async function* readCSV<T>(pathToFile: string): AsyncGenerator<T> {
    const parser = parse({ columns: true, cast: castNumbers });
    const stream = fs.createReadStream(pathToFile).pipe(parser);

    for await (const data of stream) {
        yield data;
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

export async function writeToCsv(pathToFile: string, row: object, index?: string) {
    let header = Object.keys(row);
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

    await ensurePath(pathToFile);
    await new Promise((resolve, reject) => {
        const writableStream = fs.createWriteStream(pathToFile, {
            flags: "a",
            encoding: "utf-8",
        });
        const stringifier = stringify({
            header: !exists, // Don't write the header on append
            columns: sortWithoutIndex(header, headerIndex),
        });
        stringifier.write(row);
        stringifier.pipe(writableStream).on("error", reject).on("finish", resolve);
        stringifier.end();
    });
}

export async function writeCsv(pathToFile: string, rows: object[], index?: string) {
    if (!rows.length) return;

    const header = _.uniq(_.flatMap(rows, _.keys));
    // By default, take first key as index
    const headerIndex = index ?? header[0]!;

    await ensurePath(pathToFile);
    await new Promise((resolve, reject) => {
        const writableStream = fs.createWriteStream(pathToFile, {
            flags: "w",
            encoding: "utf-8",
        });
        const stringifier = stringify({
            header: true,
            columns: sortWithoutIndex(header, headerIndex),
        });
        for (const row of rows) {
            stringifier.write(row);
        }
        stringifier.pipe(writableStream).on("error", reject).on("finish", resolve);
        stringifier.end();
    });
}
