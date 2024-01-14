import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";
import { ENTITY_RESOURCES } from "../resources/entities";
import { compileDetails, compileIcons } from "../utils/compile";

parentPort?.on("message", async (id: bcked.entity.Id) => {
    try {
        const res = await Promise.all([
            compileDetails(ENTITY_RESOURCES, id),
            compileIcons(ENTITY_RESOURCES, PATHS.entities, id),
        ]);

        parentPort?.postMessage(res);
    } catch (error) {
        console.error(error);
        await sendErrorReport(`/${PATHS.entities}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
