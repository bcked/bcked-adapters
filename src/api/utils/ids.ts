import fs from "node:fs/promises";
import { PATHS } from "../../constants";

export async function getAssetIds(): Promise<bcked.asset.Id[]> {
    const assetIds = await fs.readdir(PATHS.assets);
    return assetIds as bcked.asset.Id[];
}

export async function getEntityIds(): Promise<bcked.entity.Id[]> {
    const entityIds = await fs.readdir(PATHS.entities);
    return entityIds as bcked.entity.Id[];
}

export async function getSystemIds(): Promise<bcked.system.Id[]> {
    const systemIds = await fs.readdir(PATHS.systems);
    return systemIds as bcked.system.Id[];
}

/** Tokens group the assets of one product on several chains. */
export async function getTokenIds(): Promise<bcked.token.Id[]> {
    try {
        return (await fs.readdir(PATHS.tokens)) as bcked.token.Id[];
    } catch {
        return [];
    }
}
