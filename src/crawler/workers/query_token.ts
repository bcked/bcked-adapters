import { parentPort } from "worker_threads";
import { PATHS } from "../../constants";
import { sendErrorReport } from "../../watcher/bot";
import { TokenAdapterProxy } from "../adapters/proxy";

const adapter = new TokenAdapterProxy();

parentPort?.on("message", async (id: bcked.token.Id) => {
    console.log(`Query token ${id}`);
    try {
        await Promise.all([adapter.getDetails(id), adapter.update(id)]);

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.tokens}/${id}`, error);
        await sendErrorReport(`/${PATHS.tokens}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
