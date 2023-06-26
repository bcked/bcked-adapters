import * as fs from "fs";
import { getBackingCsvPath, getPriceCsvPath, getSupplyCsvPath } from "./helper";
import { readLastEntry } from "./primitive/csv";
import { minInMs } from "./primitive/time";

export async function getCached<T extends object & { timestamp: primitive.ISODateTimeString }>(
    pathToFile: string,
    threshold: number = minInMs(10)
): Promise<T | null> {
    if (!fs.existsSync(pathToFile)) return null;

    const data = await readLastEntry<T>(pathToFile);
    const duration = Date.now() - new Date(data.timestamp).getTime();

    if (duration > threshold) return null;

    return data;
}

export async function hasCached(
    pathToFile: string,
    threshold: number = minInMs(10)
): Promise<boolean> {
    const cached = await getCached(pathToFile, threshold);
    return cached != null;
}

export async function getCachedPrice(
    identifier: bcked.asset.Identifier,
    threshold: number = minInMs(10)
): Promise<bcked.asset.Price | null> {
    return getCached<bcked.asset.Price>(getPriceCsvPath(identifier), threshold);
}

export async function hasCachedPrice(
    identifier: bcked.asset.Identifier,
    threshold: number = minInMs(10)
): Promise<boolean> {
    const cachedPrice = await getCachedPrice(identifier, threshold);
    return cachedPrice != null;
}

export async function getCachedSupply(
    identifier: bcked.asset.Identifier,
    threshold: number = minInMs(10)
): Promise<bcked.asset.Supply | null> {
    return getCached<bcked.asset.Supply>(getSupplyCsvPath(identifier), threshold);
}

export async function hasCachedSupply(
    identifier: bcked.asset.Identifier,
    threshold: number = minInMs(10)
): Promise<boolean> {
    const cachedSupply = await getCachedSupply(identifier, threshold);
    return cachedSupply != null;
}

export async function getCachedBacking(
    identifier: bcked.asset.Identifier,
    threshold: number = minInMs(10)
): Promise<bcked.asset.Backing | null> {
    return getCached<bcked.asset.Backing>(getBackingCsvPath(identifier), threshold);
}

export async function hasCachedBacking(
    identifier: bcked.asset.Identifier,
    threshold: number = minInMs(10)
): Promise<boolean> {
    const cachedBacking = await getCachedBacking(identifier, threshold);
    return cachedBacking != null;
}
