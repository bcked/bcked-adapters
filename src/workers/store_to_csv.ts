import * as _ from "lodash";
import { parentPort, workerData } from "worker_threads";
import { hasCached } from "../utils/cache";
import { writeToCsv } from "../utils/primitive/csv";

async function storeToCsv() {
    if (parentPort == null)
        throw new Error(`Parent port for storing asset data ${workerData} missing.`);

    const { data, to } = workerData as { data: object; to: Record<string, string> };

    const noCsvPathDefined = _.difference(Object.keys(data), Object.keys(to));
    if (noCsvPathDefined.length) throw new Error(`Missing CSV path for ${noCsvPathDefined}.`);

    await Promise.all(
        Object.entries(data)
            .filter(([, value]) => value != null)
            .map(async ([key, value]) => {
                if (!(await hasCached(to[key]!, value.timestamp)))
                    await writeToCsv(to[key]!, value);
            })
    );

    parentPort.close();
}

storeToCsv();
