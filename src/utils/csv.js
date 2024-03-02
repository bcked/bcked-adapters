"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsecutiveLookup = exports.createCsv = exports.appendCsv = exports.ensureSameHeader = exports.writeToCsv = exports.rewriteCSV = exports.readCSV = exports.readClosestEntry = exports.readLastEntry = void 0;
const csv_1 = require("csv");
const sync_1 = require("csv/sync");
const flat_1 = require("flat"); // Serialize nested data structures
const fs_1 = __importDefault(require("fs"));
const lodash_1 = __importDefault(require("lodash"));
const stream_1 = require("stream");
const array_1 = require("./array");
const files_1 = require("./files");
const time_1 = require("./time");
const date_fns_1 = require("date-fns");
const promises_1 = require("stream/promises");
const stream_2 = require("./stream");
const time_2 = require("./time");
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
    const stream = fs_1.default.createReadStream(pathToFile).pipe((0, csv_1.parse)({
        columns: true,
        cast: castNumbers,
        skipEmptyLines: true,
        skipRecordsWithError: true,
    }));
    for await (const row of stream) {
        yield (0, flat_1.unflatten)(row);
    }
}
exports.readCSV = readCSV;
async function readHeadersFromStream(rows) {
    // Read the first row to get the header
    const [value, _rows] = await (0, stream_2.getFirstElement)(rows);
    if (!value)
        return [undefined, undefined];
    const rowFlattened = (0, flat_1.flatten)(value);
    // Ensure header consistency
    const header = Object.keys(rowFlattened);
    return [(0, array_1.concat)(value, _rows), header];
}
/**
 * Change the header of a CSV file.
 * @param pathToFile The path to the CSV file.
 * @param header The new header to be written to the CSV file.
 */
async function rewriteCSV(pathToFile, header, readStream = undefined) {
    if (!readStream) {
        readStream = readCSV(pathToFile);
    }
    const stringifier = (0, csv_1.stringify)({ header: true, columns: header });
    const tempPath = pathToFile.replace(".csv", "_temp.csv");
    const writeStream = fs_1.default.createWriteStream(tempPath, {
        encoding: "utf-8",
    });
    await (0, promises_1.pipeline)(readStream, stringifier, writeStream);
    await fs_1.default.promises.rename(tempPath, pathToFile);
}
exports.rewriteCSV = rewriteCSV;
async function writeToCsv(pathToFile, rows, index) {
    const [_rows, _header] = await readHeadersFromStream(rows);
    if (!_rows || !_header.length)
        return;
    // By default, take first key as index
    const headerIndex = index ?? _header[0];
    const header = (0, array_1.sortWithoutIndex)(_header, headerIndex);
    await appendCsv(pathToFile, _rows, header);
}
exports.writeToCsv = writeToCsv;
async function ensureSameHeader(pathToFile, header) {
    const csvStream = readCSV(pathToFile);
    const [rows, existingHeader] = await readHeadersFromStream(csvStream);
    if (!existingHeader)
        return header;
    const newHeaders = lodash_1.default.difference(header, existingHeader);
    // If no new headers, return the existing headers
    if (!newHeaders.length)
        return existingHeader;
    // Get combined header
    const combinedHeader = (0, array_1.sortWithoutIndex)(lodash_1.default.union(existingHeader, header), header[0]);
    // Rewrite CSV to fill old entries for new headers
    await rewriteCSV(pathToFile, combinedHeader, rows);
    return combinedHeader;
}
exports.ensureSameHeader = ensureSameHeader;
async function appendCsv(pathToFile, rows, header) {
    const exists = fs_1.default.existsSync(pathToFile);
    if (exists) {
        header = await ensureSameHeader(pathToFile, header);
    }
    else {
        await (0, files_1.ensurePath)(pathToFile);
    }
    const rowsReadable = stream_1.Readable.from(rows);
    const stringifier = (0, csv_1.stringify)({
        header: !exists,
        columns: header,
    });
    const writeStream = fs_1.default.createWriteStream(pathToFile, {
        flags: "a",
    });
    await (0, promises_1.pipeline)(rowsReadable, stringifier, writeStream);
}
exports.appendCsv = appendCsv;
async function createCsv(pathToFile, rows, header) {
    await (0, files_1.ensurePath)(pathToFile);
    const rowsReadable = stream_1.Readable.from(rows);
    const stringifier = (0, csv_1.stringify)({
        header: true,
        columns: header,
    });
    const writableStream = fs_1.default.createWriteStream(pathToFile, {
        flags: "w",
    });
    await (0, promises_1.pipeline)(rowsReadable, stringifier, writableStream);
}
exports.createCsv = createCsv;
class ConsecutiveLookup {
    constructor(csvPath) {
        this.csvPath = csvPath;
        this.values = new Map();
        this.done = false;
        this.lastTimestamp = undefined;
        this.csvStream = readCSV(csvPath);
    }
    async getClosest(timestamp, window = (0, date_fns_1.hoursToMilliseconds)(12)) {
        // Read new values from csvStream and store them in the values map
        while (!this.done && // Stop if the csvStream is done
            (!this.lastTimestamp || !(0, time_2.isNewer)(timestamp, this.lastTimestamp, window)) // Read ahead the specified time window
        ) {
            const { value, done } = await this.csvStream.next();
            this.done = done;
            if (!value)
                break;
            this.values.set(value.timestamp, value);
            this.lastTimestamp = value.timestamp;
        }
        // Find the best match in the values cache
        let bestMatch;
        let bestDistance;
        for (const value of this.values.values()) {
            // Ignore and delete entries older than time window
            if ((0, time_2.isNewer)(value.timestamp, timestamp, window)) {
                this.values.delete(value.timestamp);
                continue;
            }
            const timeDistance = (0, time_2.distance)(timestamp, value.timestamp);
            if (!bestDistance || timeDistance < bestDistance) {
                bestMatch = value;
                bestDistance = timeDistance;
            }
            else {
                break; // Values are sorted, so we can stop here.
            }
        }
        return bestMatch;
    }
}
exports.ConsecutiveLookup = ConsecutiveLookup;
//# sourceMappingURL=csv.js.map