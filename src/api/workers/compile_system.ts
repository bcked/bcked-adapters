import path from "path";
import { parentPort } from "worker_threads";
import { FILES, PATHS } from "../../constants";
import { compileHistory } from "../utils/history";
import { sendErrorReport } from "../../watcher/bot";
import { SYSTEM_RESOURCES } from "../resources/systems";
import { compileAssets, compileDetails, compileIcons } from "../utils/compile";

parentPort?.on("message", async (id: bcked.system.Id) => {
    console.log(`Compile system ${id}`);
    try {
        await Promise.all([
            SYSTEM_RESOURCES.system(id),
            compileDetails(SYSTEM_RESOURCES, PATHS.systems, id),
            compileIcons(SYSTEM_RESOURCES, PATHS.systems, id),
            compileAssets(SYSTEM_RESOURCES, PATHS.systems, id),
            compileHistory<typeof id, bcked.system.TotalValueLocked, "totalValueLocked">(
                path.join(PATHS.entities, id, PATHS.records, FILES.csv.totalValueLocked),
                id,
                "totalValueLocked",
                SYSTEM_RESOURCES.totalValueLockedHistory,
                SYSTEM_RESOURCES.totalValueLockedYear,
                SYSTEM_RESOURCES.totalValueLockedMonth,
                SYSTEM_RESOURCES.totalValueLockedDay,
                SYSTEM_RESOURCES.totalValueLockedHour
            ),
        ]);

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.systems}/${id}`, error);
        await sendErrorReport(`/${PATHS.systems}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
