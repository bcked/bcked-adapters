import { parentPort } from "worker_threads";
import { AssetAdapterProxy } from "../utils/adapters/proxy";
import { fromId } from "../utils/helper";

const adapter = new AssetAdapterProxy();

parentPort?.on("message", async (assetId: bcked.asset.Id) => {
    const identifier = fromId(assetId);
    const res = await Promise.all([
        adapter.getDetails(identifier),
        adapter.getPrice(identifier),
        adapter.getSupply(identifier),
        adapter.getBacking(identifier),
    ]);

    parentPort?.postMessage(res);
});
