import fs from "fs";
import { readClosestEntry, readLastEntry } from "../primitive/csv";
import { isClose } from "./time";

export async function getLatest<T extends object & { timestamp: primitive.DateLike }>(
    pathToFile: string
): Promise<T | null> {
    if (!fs.existsSync(pathToFile)) return null;
    return await readLastEntry<T>(pathToFile);
}

export async function getClosest<T extends object & { timestamp: primitive.DateLike }>(
    pathToFile: string,
    timestamp: primitive.DateLike,
    threshold?: number
): Promise<T | null> {
    if (!fs.existsSync(pathToFile)) return null;

    const closest = await readClosestEntry<T>(pathToFile, timestamp);

    if (
        threshold !== undefined &&
        closest !== null &&
        !isClose(timestamp, closest.timestamp, threshold)
    ) {
        // If it doesn't match the threshold, return null.
        return null;
    }

    return closest;
}
