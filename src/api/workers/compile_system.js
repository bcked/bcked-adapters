"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const paths_1 = require("../../paths");
const bot_1 = require("../../watcher/bot");
const systems_1 = require("../resources/systems");
const compile_1 = require("../utils/compile");
worker_threads_1.parentPort?.on("message", async (id) => {
    console.log(`Compile system ${id}`);
    try {
        const res = await Promise.all([
            systems_1.SYSTEM_RESOURCES.system(id),
            (0, compile_1.compileDetails)(systems_1.SYSTEM_RESOURCES, id),
            (0, compile_1.compileIcons)(systems_1.SYSTEM_RESOURCES, paths_1.PATHS.systems, id),
        ]);
        worker_threads_1.parentPort?.postMessage(res);
    }
    catch (error) {
        console.error(`/${paths_1.PATHS.systems}/${id}`, error);
        await (0, bot_1.sendErrorReport)(`/${paths_1.PATHS.systems}/${id}`, error);
        worker_threads_1.parentPort?.postMessage(null);
    }
});
//# sourceMappingURL=compile_system.js.map