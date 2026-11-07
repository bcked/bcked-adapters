import path from "path";
import { parentPort } from "worker_threads";
import { FILES, PATHS } from "../../constants";
import { compileHistory } from "../utils/history";
import { sendErrorReport } from "../../watcher/bot";
import { ENTITY_RESOURCES } from "../resources/entities";
import { compileAssets, compileDetails, compileIcons } from "../utils/compile";

parentPort?.on("message", async (id: bcked.entity.Id) => {
    console.log(`Compile entity ${id}`);
    try {
        await Promise.all([
            ENTITY_RESOURCES.entity(id),
            compileDetails(ENTITY_RESOURCES, PATHS.entities, id),
            compileIcons(ENTITY_RESOURCES, PATHS.entities, id),
            compileAssets(ENTITY_RESOURCES, PATHS.entities, id),
            compileHistory<typeof id, bcked.entity.TotalValueLocked, "totalValueLocked">(
                path.join(PATHS.entities, id, PATHS.records, FILES.csv.totalValueLocked),
                id,
                "totalValueLocked",
                ENTITY_RESOURCES.totalValueLockedHistory,
                ENTITY_RESOURCES.totalValueLockedYear,
                ENTITY_RESOURCES.totalValueLockedMonth,
                ENTITY_RESOURCES.totalValueLockedDay,
                ENTITY_RESOURCES.totalValueLockedHour
            ),
        ]);

        parentPort?.postMessage(null);
    } catch (error) {
        console.error(`/${PATHS.entities}/${id}`, error);
        await sendErrorReport(`/${PATHS.entities}/${id}`, error);
        parentPort?.postMessage(null);
    }
});
