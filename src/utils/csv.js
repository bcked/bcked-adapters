"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeCsv = exports.writeToCsv = exports.rewriteCSV = exports.readCSVForDates = exports.readCSV = exports.readClosestEntry = exports.readLastEntry = exports.readHeaders = void 0;
const csv_1 = require("csv");
const sync_1 = require("csv/sync");
const flat_1 = require("flat"); // Serialize nested data structures
const fs_1 = __importDefault(require("fs"));
const lodash_1 = __importDefault(require("lodash"));
const array_1 = require("./array");
const files_1 = require("./files");
const time_1 = require("./time");
/**
 * Read the headers of a CSV file.
 * @param pathToFile The file path to the file to be read.
 * @returns The headers in an array.
 */
async function readHeaders(pathToFile) {
    const line = await (0, files_1.readFirstLine)(pathToFile);
    return (0, sync_1.parse)(line)[0];
}
exports.readHeaders = readHeaders;
function castNumbers(value, context) {
    if (context.header)
        return value;
    if (value == "")
        return value;
    try {
        const asNumber = Number(value);
        if (!isNaN(asNumber))
            return asNumber;
    }
    catch {
        return value;
    }
    return value;
}
/**
 * Read the last entry of a CSV file.
 * @param pathToFile The file path to the file to be read.
 * @returns The last entry of the CSV as an object.
 */
async function readLastEntry(pathToFile) {
    const lines = await Promise.all([(0, files_1.readFirstLine)(pathToFile), (0, files_1.readLastLines)(pathToFile, 1)]);
    return (0, flat_1.unflatten)((0, sync_1.parse)(lines.join("\n"), { columns: true, cast: castNumbers })[0]);
}
exports.readLastEntry = readLastEntry;
async function readClosestEntry(pathToFile, timestamp) {
    let closest = null;
    const parser = fs_1.default.createReadStream(pathToFile).pipe((0, csv_1.parse)({
        columns: true,
        cast: castNumbers,
    }));
    for await (const record of parser) {
        if (closest == null || (0, time_1.isCloser)(timestamp, record.timestamp, closest.timestamp)) {
            closest = record;
        }
        else {
            // This expects the entries in the CSV to be sorted by timestamp.
            break;
        }
    }
    return (0, flat_1.unflatten)(closest);
}
exports.readClosestEntry = readClosestEntry;
async function* readCSV(pathToFile) {
    const parser = (0, csv_1.parse)({ columns: true, cast: castNumbers });
    const stream = fs_1.default.createReadStream(pathToFile).pipe(parser);
    for await (const data of stream) {
        yield (0, flat_1.unflatten)(data);
    }
}
exports.readCSV = readCSV;
async function* readCSVForDates(pathToFile, filter) {
    for await (const data of readCSV(pathToFile)) {
        const parts = (0, time_1.getDateParts)(data.timestamp);
        if (Object.keys(filter)
            .map((key) => key)
            .every((key) => Number(filter[key]) === Number(parts[key]))) {
            yield data;
        }
    }
}
exports.readCSVForDates = readCSVForDates;
async function rewriteCSV(pathToFile, targetHeader) {
    const parser = (0, csv_1.parse)({ columns: true });
    const stringifier = (0, csv_1.stringify)({ header: true, columns: targetHeader });
    const tempPath = pathToFile.replace(".csv", "_temp.csv");
    const writeStream = fs_1.default.createWriteStream(tempPath, {
        encoding: "utf-8",
    });
    await new Promise((resolve, reject) => {
        fs_1.default.createReadStream(pathToFile)
            .on("error", reject)
            .pipe(parser)
            .pipe(stringifier)
            .pipe(writeStream)
            .on("error", reject)
            .on("finish", resolve);
    });
    await fs_1.default.promises.rename(tempPath, pathToFile);
}
exports.rewriteCSV = rewriteCSV;
async function writeToCsv(pathToFile, row, index) {
    const rowFlattened = (0, flat_1.flatten)(row);
    let header = Object.keys(rowFlattened);
    // By default, take first key as index
    const headerIndex = index ?? header[0];
    const exists = fs_1.default.existsSync(pathToFile);
    if (exists) {
        const existingHeader = await readHeaders(pathToFile);
        const newHeaders = lodash_1.default.difference(header, existingHeader);
        // Get combined header
        header = (0, array_1.sortWithoutIndex)(lodash_1.default.union(existingHeader, header), headerIndex);
        if (newHeaders.length) {
            // Rewrite CSV to fill old entries for new headers
            await rewriteCSV(pathToFile, header);
        }
    }
    await (0, files_1.ensurePath)(pathToFile);
    await new Promise((resolve, reject) => {
        const writableStream = fs_1.default.createWriteStream(pathToFile, {
            flags: "a",
            encoding: "utf-8",
        });
        const stringifier = (0, csv_1.stringify)({
            header: !exists,
            columns: (0, array_1.sortWithoutIndex)(header, headerIndex),
        });
        stringifier.write(rowFlattened);
        stringifier.pipe(writableStream).on("error", reject).on("finish", resolve);
        stringifier.end();
    });
}
exports.writeToCsv = writeToCsv;
async function writeCsv(pathToFile, rows, index) {
    if (!rows.length)
        return;
    const rowsFlattened = rows.map((row) => (0, flat_1.flatten)(row));
    const header = lodash_1.default.uniq(lodash_1.default.flatMap(rowsFlattened, lodash_1.default.keys));
    // By default, take first key as index
    const headerIndex = index ?? header[0];
    await (0, files_1.ensurePath)(pathToFile);
    await new Promise((resolve, reject) => {
        const writableStream = fs_1.default.createWriteStream(pathToFile, {
            flags: "w",
            encoding: "utf-8",
        });
        const stringifier = (0, csv_1.stringify)({
            header: true,
            columns: (0, array_1.sortWithoutIndex)(header, headerIndex),
        });
        for (const row of rowsFlattened) {
            stringifier.write(row);
        }
        stringifier.pipe(writableStream).on("error", reject).on("finish", resolve);
        stringifier.end();
    });
}
exports.writeCsv = writeCsv;
//# sourceMappingURL=csv.js.map