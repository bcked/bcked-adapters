import { parentPort } from "worker_threads";
import { SystemAdapterProxy } from "../adapters/proxy";

const adapter = new SystemAdapterProxy();

parentPort?.on("message", async (systemId: bcked.system.Id) => {
    const res = await Promise.all([adapter.getDetails(systemId), adapter.update(systemId)]);

    parentPort?.postMessage(res);
});
