import { parse, stringify } from "csv";
import { parse as parseSync } from "csv/sync";

import * as fs from "fs";
import * as _ from "lodash";
import * as path from "path";

import { readFirstLine, readLastLines } from "./files";

/**
 * Read the headers of a CSV file.
 * @param pathToFile The file path to the file to be read.
 * @returns The headers in an array.
 */
export async function readHeaders(pathToFile: string): Promise<string[]> {
    const line = await readFirstLine(pathToFile);
    return parseSync(line)[0];
}

/**
 * Read the last entry of a CSV file.
 * @param pathToFile The file path to the file to be read.
 * @returns The last entry of the CSV as an object.
 */
export async function readLastEntry<T extends object>(pathToFile: string): Promise<T> {
    const lines = await Promise.all([readFirstLine(pathToFile), readLastLines(pathToFile, 1)]);
    return parseSync(lines.join("\n"), { columns: true })[0];
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
    index = index ?? header[0]!;

    const exists = fs.existsSync(pathToFile);
    if (exists) {
        const existingHeader = await readHeaders(pathToFile);
        const newHeaders = _.difference(header, existingHeader);

        // Get combined header
        header = _.concat(index, _.without(_.union(existingHeader, header), index).sort());

        if (newHeaders.length) {
            // Rewrite CSV to fill old entries for new headers
            await rewriteCSV(pathToFile, header);
        }
    }

    const dir = path.dirname(pathToFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    await new Promise((resolve, reject) => {
        const writableStream = fs.createWriteStream(pathToFile, {
            flags: "a",
            encoding: "utf-8",
        });
        const stringifier = stringify({
            header: !exists, // Don't write the header on append
            columns: header,
        });
        stringifier.write(row);
        stringifier.pipe(writableStream).on("error", reject).on("finish", resolve);
    });
}
