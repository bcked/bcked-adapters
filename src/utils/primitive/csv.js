"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeToCsv = exports.rewriteCSV = exports.readLastEntry = exports.readHeaders = void 0;
const csv_1 = require("csv");
const sync_1 = require("csv/sync");
const fs = require("fs");
const _ = require("lodash");
const files_1 = require("./files");
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
/**
 * Read the last entry of a CSV file.
 * @param pathToFile The file path to the file to be read.
 * @returns The last entry of the CSV as an object.
 */
async function readLastEntry(pathToFile) {
    const lines = await Promise.all([(0, files_1.readFirstLine)(pathToFile), (0, files_1.readLastLines)(pathToFile, 1)]);
    return (0, sync_1.parse)(lines.join("\n"), { columns: true })[0];
}
exports.readLastEntry = readLastEntry;
async function rewriteCSV(pathToFile, targetHeader) {
    const parser = (0, csv_1.parse)({ columns: true });
    const stringifier = (0, csv_1.stringify)({ header: true, columns: targetHeader });
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
exports.rewriteCSV = rewriteCSV;
async function writeToCsv(pathToFile, row, index) {
    let header = Object.keys(row);
    // By default, take first key as index
    index = index ?? header[0];
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
    await new Promise((resolve, reject) => {
        const writableStream = fs.createWriteStream(pathToFile, {
            flags: "a",
            encoding: "utf-8",
        });
        const stringifier = (0, csv_1.stringify)({
            header: !exists,
            columns: header,
        });
        stringifier.write(row);
        stringifier.pipe(writableStream).on("error", reject).on("finish", resolve);
    });
}
exports.writeToCsv = writeToCsv;
//# sourceMappingURL=csv.js.map