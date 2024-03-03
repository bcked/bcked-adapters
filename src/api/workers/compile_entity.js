"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const paths_1 = require("../../paths");
const bot_1 = require("../../watcher/bot");
const entities_1 = require("../resources/entities");
const compile_1 = require("../utils/compile");
worker_threads_1.parentPort?.on("message", async (id) => {
    console.log(`Compile entity ${id}`);
    try {
        await Promise.all([
            entities_1.ENTITY_RESOURCES.entity(id),
            (0, compile_1.compileDetails)(entities_1.ENTITY_RESOURCES, paths_1.PATHS.entities, id),
            (0, compile_1.compileIcons)(entities_1.ENTITY_RESOURCES, paths_1.PATHS.entities, id),
            (0, compile_1.compileAssets)(entities_1.ENTITY_RESOURCES, paths_1.PATHS.entities, id),
        ]);
        worker_threads_1.parentPort?.postMessage(null);
    }
    catch (error) {
        console.error(`/${paths_1.PATHS.entities}/${id}`, error);
        await (0, bot_1.sendErrorReport)(`/${paths_1.PATHS.entities}/${id}`, error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=compile_entity.js.map