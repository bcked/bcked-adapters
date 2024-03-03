import { parentPort } from "worker_threads";
import { PATHS } from "../../constants";
import { fromId } from "../../utils/helper";
import { sendErrorReport } from "../../watcher/bot";
import { AssetAdapterProxy } from "../adapters/proxy";

const adapter = new AssetAdapterProxy();

parentPort?.on("message", async (id: bcked.asset.Id) => {
    console.log(`Query asset ${id}`);
    const identifier = fromId(id);
    try {
        await Promise.all([
            adapter.getDetails(identifier),
            adapter.getPrice(identifier),
            adapter.getSupply(identifier),
            adapter.getBacking(identifier),
        ]);

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.assets}/${id}`, error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
