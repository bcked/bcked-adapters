import { parentPort } from "worker_threads";
import { fromId } from "../../utils/helper";
import { sendErrorReport } from "../../watcher/bot";
import { AssetAdapterProxy } from "../adapters/proxy";

const adapter = new AssetAdapterProxy();

parentPort?.on("message", async (assetId: bcked.asset.Id) => {
    const identifier = fromId(assetId);
    try {
        const res = await Promise.all([
            adapter.getDetails(identifier),
            adapter.getPrice(identifier),
            adapter.getSupply(identifier),
            adapter.getBacking(identifier),
        ]);

        parentPort?.postMessage(res);
    } catch (error) {
        console.error(error);
        await sendErrorReport(error);
        parentPort?.postMessage(null);
    }
});
