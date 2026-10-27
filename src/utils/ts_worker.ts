import { Worker as JsWorker, type WorkerOptions } from "worker_threads";

// Bun runs TypeScript natively, so workers are loaded from their .ts source.
export class Worker extends JsWorker {
    constructor(filename: string, options?: WorkerOptions) {
        super(require.resolve(filename), options);
    }
}
