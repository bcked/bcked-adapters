import { parentPort } from "worker_threads";
import { PATHS } from "../../paths";
import { sendErrorReport } from "../../watcher/bot";
import { SYSTEM_RESOURCES } from "../resources/systems";
import { compileDetails, compileIcons } from "../utils/compile";

parentPort?.on("message", async (id: bcked.system.Id) => {
    console.log(`Compile system ${id}`);
    try {
        const res = await Promise.all([
            SYSTEM_RESOURCES.system(id),
            compileDetails(SYSTEM_RESOURCES, id),
            compileIcons(SYSTEM_RESOURCES, PATHS.systems, id),
        ]);

        parentPort?.postMessage(res);
    } catch (error) {
        console.error(`/${PATHS.systems}/${id}`, error);
        await sendErrorReport(`/${PATHS.systems}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
