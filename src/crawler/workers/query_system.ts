import { parentPort } from "worker_threads";
import { PATHS } from "../../constants";
import { sendErrorReport } from "../../watcher/bot";
import { SystemAdapterProxy } from "../adapters/proxy";

const adapter = new SystemAdapterProxy();

parentPort?.on("message", async (id: bcked.system.Id) => {
    console.log(`Query system ${id}`);
    try {
        await Promise.all([adapter.getDetails(id), adapter.update(id)]);

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.systems}/${id}`, error);
        await sendErrorReport(`/${PATHS.systems}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
