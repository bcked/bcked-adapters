import { Worker as JsWorker, WorkerOptions } from "worker_threads";

export function adaptFileExt(filename: string): string {
    return process.env.DEV_MODE ? filename : filename.replace(".ts", ".js");
}

export class Worker extends JsWorker {
    constructor(filename: string, options?: WorkerOptions) {
        const adaptedFilename = adaptFileExt(filename);
        const resolvedPath = require.resolve(adaptedFilename);
        super(resolvedPath, {
            ...options,
            execArgv: resolvedPath.endsWith(".ts") ? ["--require", "ts-node/register"] : undefined,
        });
    }
}
