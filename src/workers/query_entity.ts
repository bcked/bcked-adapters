import { parentPort } from "worker_threads";
import { EntityAdapterProxy } from "../utils/adapters/proxy";

const adapter = new EntityAdapterProxy();

parentPort?.on("message", async (entityId: bcked.entity.Id) => {
    const res = await Promise.all([adapter.getDetails(entityId), adapter.update(entityId)]);

    parentPort?.postMessage(res);
});
