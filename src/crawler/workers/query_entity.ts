import { parentPort } from "worker_threads";
import { sendErrorReport } from "../../watcher/bot";
import { EntityAdapterProxy } from "../adapters/proxy";

const adapter = new EntityAdapterProxy();

parentPort?.on("message", async (entityId: bcked.entity.Id) => {
    try {
        const res = await Promise.all([adapter.getDetails(entityId), adapter.update(entityId)]);

        parentPort?.postMessage(res);
    } catch (error) {
        console.error(error);
        await sendErrorReport(`/entities/${entityId}`, error);
        parentPort?.postMessage(null);
    }
});
