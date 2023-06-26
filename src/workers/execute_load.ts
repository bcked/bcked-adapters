import * as path from "path";
import { parentPort, workerData } from "worker_threads";

async function execute() {
    const { script, call } = workerData as { script: string; call: Record<string, string> };

    if (parentPort == null)
        throw new Error(`Parent port for execution of script ${script} missing.`);

    const { default: Adapter } = await import(path.resolve(script));

    const adapter = new Adapter();

    const data = Object.fromEntries(
        await Promise.all(
            Object.entries(call).map(async ([field, fn]) => [field, await adapter[fn]()])
        )
    );

    parentPort.postMessage(data);
}

execute();
