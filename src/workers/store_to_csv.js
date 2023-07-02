"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const worker_threads_1 = require("worker_threads");
const cache_1 = require("../utils/cache");
const csv_1 = require("../utils/primitive/csv");
async function storeToCsv() {
    if (worker_threads_1.parentPort == null)
        throw new Error(`Parent port for storing asset data ${worker_threads_1.workerData} missing.`);
    const { data, to } = worker_threads_1.workerData;
    const noCsvPathDefined = _.difference(Object.keys(data), Object.keys(to));
    if (noCsvPathDefined.length)
        throw new Error(`Missing CSV path for ${noCsvPathDefined}.`);
    await Promise.all(Object.entries(data)
        .filter(([, value]) => value != null)
        .map(async ([key, value]) => {
        if (!(await (0, cache_1.hasCached)(to[key], value.timestamp)))
            await (0, csv_1.writeToCsv)(to[key], value);
    }));
    worker_threads_1.parentPort.close();
}
storeToCsv();
//# sourceMappingURL=store_to_csv.js.map