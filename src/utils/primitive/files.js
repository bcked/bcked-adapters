"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readFirstLine = exports.readLastLines = void 0;
const fs = require("fs");
const readline = require("readline");
const NEW_LINE_CHARACTERS = ["\n"];
async function readPreviousChar(stat, file, currentCharacterCount, encoding = "utf-8") {
    return new Promise((resolve, reject) => {
        fs.read(file, Buffer.alloc(1), 0, 1, stat.size - 1 - currentCharacterCount, (err, bytesRead, buffer) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(buffer.toString(encoding));
            }
        });
    });
}
/**
 * Read in the last `n` lines of a file
 * @param  {string}   inputFilePath   - file (direct or relative path to file.)
 * @param  {int}      maxLineCount    - max number of lines to read in.
 * @param  {encoding} encoding        - specifies the character encoding to be used, or 'buffer'. defaults to 'utf8'.
 *
 * @return {promise}  a promise resolved with the lines or rejected with an error.
 */
async function readLastLines(inputFilePath, maxLineCount, encoding = "utf-8") {
    if (!fs.existsSync(inputFilePath))
        throw new Error(`File ${inputFilePath} does not exist.`);
    const [stat, file] = await Promise.all([
        new Promise((resolve, reject) => 
        // Load file Stats.
        fs.stat(inputFilePath, (err, stat) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(stat);
            }
        })),
        new Promise((resolve, reject) => 
        // Open file for reading.
        fs.open(inputFilePath, "r", (err, file) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(file);
            }
        })),
    ]);
    let chars = 0;
    let lineCount = 0;
    let lines = "";
    while (lines.length < stat.size && lineCount < maxLineCount) {
        const nextCharacter = await readPreviousChar(stat, file, chars, encoding);
        lines = nextCharacter + lines;
        if (NEW_LINE_CHARACTERS.includes(nextCharacter) && lines.length > 1) {
            lineCount++;
        }
        chars++;
        if (lines.length > stat.size) {
            lines = lines.substring(lines.length - stat.size);
        }
    }
    if (NEW_LINE_CHARACTERS.includes(lines.substring(0, 1))) {
        lines = lines.substring(1);
    }
    fs.closeSync(file);
    return lines;
}
exports.readLastLines = readLastLines;
async function readFirstLine(pathToFile) {
    const readable = fs.createReadStream(pathToFile);
    const reader = readline.createInterface({ input: readable });
    const line = await new Promise((resolve) => {
        reader.on("line", (line) => {
            reader.close();
            resolve(line);
        });
    });
    readable.close();
    return line;
}
exports.readFirstLine = readFirstLine;
//# sourceMappingURL=files.js.map