import fs from "node:fs";
import { unlink } from "node:fs/promises";
import path from "node:path";
import readline from "readline";
import { getFirstElement } from "./stream";

const NEW_LINE_CHARACTERS = ["\n"];

async function readPreviousChar(
    stat: fs.Stats,
    file: number,
    currentCharacterCount: number,
    encoding: BufferEncoding = "utf-8"
): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.read(
            file,
            Buffer.alloc(1),
            0,
            1,
            stat.size - 1 - currentCharacterCount,
            (err, _, buffer) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(buffer.toString(encoding));
                }
            }
        );
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
export async function readLastLines(
    inputFilePath: string,
    maxLineCount: number,
    encoding: BufferEncoding = "utf-8"
): Promise<string> {
    if (!fs.existsSync(inputFilePath)) throw new Error(`File ${inputFilePath} does not exist.`);

    const [stat, file] = await Promise.all([
        new Promise<fs.Stats>((resolve, reject) =>
            // Load file Stats.
            fs.stat(inputFilePath, (err, stat) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stat);
                }
            })
        ),
        new Promise<number>((resolve, reject) =>
            // Open file for reading.
            fs.open(inputFilePath, "r", (err, file) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(file);
                }
            })
        ),
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

export async function readFirstLine(pathToFile: string): Promise<string | undefined> {
    const readable = fs.createReadStream(pathToFile);
    const reader = readline.createInterface({ input: readable });
    const [line] = await getFirstElement(reader);

    // TODO this doesn't close the stream
    // await readable.close();
    // await Readable.once(readable, "close");
    return line;
}

export async function ensurePath(pathToFile: string) {
    const dir = path.dirname(pathToFile);
    if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
    }
}

export async function writeBuffer(pathToFile: string, data: Buffer) {
    await ensurePath(pathToFile);
    await fs.promises.writeFile(pathToFile, data);
}

export async function writeJson(pathToFile: string, data: object) {
    await ensurePath(pathToFile);
    await fs.promises.writeFile(pathToFile, JSON.stringify(data, null, 4));
}

export async function readJson<T>(pathToFile: string): Promise<T | null> {
    try {
        return JSON.parse(await fs.promises.readFile(pathToFile, { encoding: "utf8" }));
    } catch {
        // Return null, in case the file doesn't exist.
        return null;
    }
}

export async function remove(filePath: string) {
    try {
        await unlink(filePath);
    } catch (error) {
        console.debug(`File ${filePath} does not exist. Skipping deletion.`);
    }
}
