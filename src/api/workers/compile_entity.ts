import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";
import { ENTITY_RESOURCES } from "../resources/entities";
import { compileDetails, compileIcons } from "../utils/compile";

parentPort?.on("message", async (id: bcked.entity.Id) => {
    console.log(`Compile entity ${id}`);
    try {
        await Promise.all([
            ENTITY_RESOURCES.entity(id),
            compileDetails(ENTITY_RESOURCES, PATHS.entities, id),
            compileIcons(ENTITY_RESOURCES, PATHS.entities, id),
        ]);

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.entities}/${id}`, error);
        await sendErrorReport(`/${PATHS.entities}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
