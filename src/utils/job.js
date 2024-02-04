"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.job = void 0;
require("dotenv/config");
const ts_node_1 = require("ts-node");
async function job(name, job) {
    console.time(name);
    if (process[ts_node_1.REGISTER_INSTANCE]) {
        process.env.DEV_MODE = "true";
    }
    await job();
    console.timeEnd(name);
}
exports.job = job;
//# sourceMappingURL=job.js.map