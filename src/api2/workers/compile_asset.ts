import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";
import { ASSET_RESOURCES } from "../resources/assets";
import { compileDetails, compileIcons } from "../utils/compile";

parentPort?.on("message", async (id: bcked.asset.Id) => {
    try {
        const res = await Promise.all([
            compileDetails(ASSET_RESOURCES, id),
            compileIcons(ASSET_RESOURCES, PATHS.assets, id),
        ]);

        parentPort?.postMessage(res);
    } catch (error) {
        console.error(error);
        await sendErrorReport(`/${PATHS.assets}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
