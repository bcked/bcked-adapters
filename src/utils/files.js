"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readJson = exports.writeJson = exports.writeBuffer = exports.ensurePath = exports.readFirstLine = exports.readLastLines = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const readline_1 = __importDefault(require("readline"));
const stream_1 = require("./stream");
const NEW_LINE_CHARACTERS = ["\n"];
async function readPreviousChar(stat, file, currentCharacterCount, encoding = "utf-8") {
    return new Promise((resolve, reject) => {
        node_fs_1.default.read(file, Buffer.alloc(1), 0, 1, stat.size - 1 - currentCharacterCount, (err, bytesRead, buffer) => {
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
    if (!node_fs_1.default.existsSync(inputFilePath))
        throw new Error(`File ${inputFilePath} does not exist.`);
    const [stat, file] = await Promise.all([
        new Promise((resolve, reject) => 
        // Load file Stats.
        node_fs_1.default.stat(inputFilePath, (err, stat) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(stat);
            }
        })),
        new Promise((resolve, reject) => 
        // Open file for reading.
        node_fs_1.default.open(inputFilePath, "r", (err, file) => {
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
    node_fs_1.default.closeSync(file);
    return lines;
}
exports.readLastLines = readLastLines;
async function readFirstLine(pathToFile) {
    const readable = node_fs_1.default.createReadStream(pathToFile);
    const reader = readline_1.default.createInterface({ input: readable });
    const [line] = await (0, stream_1.getFirstElement)(reader);
    // TODO this doesn't close the stream
    // await readable.close();
    // await Readable.once(readable, "close");
    return line;
}
exports.readFirstLine = readFirstLine;
async function ensurePath(pathToFile) {
    const dir = node_path_1.default.dirname(pathToFile);
    if (!node_fs_1.default.existsSync(dir)) {
        await node_fs_1.default.promises.mkdir(dir, { recursive: true });
    }
}
exports.ensurePath = ensurePath;
async function writeBuffer(pathToFile, data) {
    await ensurePath(pathToFile);
    await node_fs_1.default.promises.writeFile(pathToFile, data);
}
exports.writeBuffer = writeBuffer;
async function writeJson(pathToFile, data) {
    await ensurePath(pathToFile);
    await node_fs_1.default.promises.writeFile(pathToFile, JSON.stringify(data, null, 4));
}
exports.writeJson = writeJson;
async function readJson(pathToFile) {
    try {
        return JSON.parse(await node_fs_1.default.promises.readFile(pathToFile, { encoding: "utf8" }));
    }
    catch {
        // Return null, in case the file doesn't exist.
        return null;
    }
}
exports.readJson = readJson;
//# sourceMappingURL=files.js.map