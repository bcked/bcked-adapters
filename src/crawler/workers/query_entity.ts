import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";
import { EntityAdapterProxy } from "../adapters/proxy";

const adapter = new EntityAdapterProxy();

parentPort?.on("message", async (id: bcked.entity.Id) => {
    console.log(`Query entity ${id}`);
    try {
        await Promise.all([adapter.getDetails(id), adapter.update(id)]);

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.entities}/${id}`, error);
        await sendErrorReport(`/${PATHS.entities}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
