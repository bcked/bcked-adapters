import { parentPort } from "worker_threads";
import { sendErrorReport } from "../../watcher/bot";
import { SystemAdapterProxy } from "../adapters/proxy";

const adapter = new SystemAdapterProxy();

parentPort?.on("message", async (systemId: bcked.system.Id) => {
    try {
        const res = await Promise.all([adapter.getDetails(systemId), adapter.update(systemId)]);

        parentPort?.postMessage(res);
    } catch (error) {
        console.error(error);
        await sendErrorReport(`/systems/${systemId}`, error);
        parentPort?.postMessage(null);
    }
});
