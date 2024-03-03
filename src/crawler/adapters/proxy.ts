import _ from "lodash";
import path from "path";
import { FILES, PATHS } from "../../constants";
import { toAsync } from "../../utils/array";
import { getLatest } from "../../utils/cache";
import { writeToCsv } from "../../utils/csv";
import { readJson, writeJson } from "../../utils/files";
import { toId } from "../../utils/helper";
import { toISOString } from "../../utils/string_formatting";
import { isNewer, minInMs } from "../../utils/time";
import { adaptFileExt } from "../../utils/ts_worker";

export async function getAdapter<Adapter>(pathToFile: string): Promise<Adapter> {
    const adapterPath = path.resolve(adaptFileExt(pathToFile));
    const { default: Adapter } = await import(adapterPath);
    return new Adapter();
}

export class AdapterCache<Adapter> {
    adapters: Record<string, Adapter>;
    constructor() {
        this.adapters = {};
    }

    async getAdapterInstance(kind: string, id: string): Promise<Adapter> {
        const key = `${kind}/${id}`;
        if (key in this.adapters) return this.adapters[key]!;
        this.adapters[key] = await getAdapter(`${kind}/${id}/index.ts`);
        return this.adapters[key]!;
    }
}

export function isNewEntry(
    cached: (object & primitive.Timestamped) | null,
    entry: (object & primitive.Timestamped) | null,
    threshold: number
) {
    const isNewEntryWithoutCache = cached == null && entry != null;
    const isNewerEntryThanCached =
        cached != null && entry != null && isNewer(cached.timestamp, entry.timestamp, threshold);

    // Only submit new entry if values changed?
    // || !_.isEqual(_.omit(cached, "timestamp"), _.omit(entry, "timestamp"))

    return isNewEntryWithoutCache || isNewerEntryThanCached;
}

export class SystemAdapterProxy extends AdapterCache<bcked.system.Adapter> {
    async getDetails(id: bcked.system.Id): Promise<bcked.system.DetailsRecord> {
        const pathToFile = path.join(PATHS.systems, id, PATHS.records, FILES.json.details);

        const lastRecorded = await readJson<bcked.system.DetailsRecord>(pathToFile);

        if (lastRecorded && !isNewer(lastRecorded.updated, Date.now(), minInMs(10)))
            return lastRecorded;

        const adapter = await this.getAdapterInstance("systems", id);
        const details = await adapter.getDetails(lastRecorded);

        if (lastRecorded && _.isEqual(_.omit(lastRecorded, ["listed", "updated"]), details))
            return lastRecorded;

        const detailsRecord = {
            ...details,
            listed: lastRecorded ? lastRecorded.listed : toISOString(Date.now()),
            updated: toISOString(Date.now()),
        };

        await writeJson(pathToFile, detailsRecord);
        return detailsRecord;
    }

    async update(id: bcked.system.Id): Promise<void> {
        const adapter = await this.getAdapterInstance("systems", id);
        await adapter.update();
    }
}

export class EntityAdapterProxy extends AdapterCache<bcked.entity.Adapter> {
    async getDetails(id: bcked.entity.Id): Promise<bcked.entity.DetailsRecord> {
        const pathToFile = path.join(PATHS.entities, id, PATHS.records, FILES.json.details);

        const lastRecorded = await readJson<bcked.entity.DetailsRecord>(pathToFile);

        if (lastRecorded && !isNewer(lastRecorded.updated, Date.now(), minInMs(10)))
            return lastRecorded;

        const adapter = await this.getAdapterInstance("entities", id);
        const details = await adapter.getDetails(lastRecorded);

        if (lastRecorded && _.isEqual(_.omit(lastRecorded, ["listed", "updated"]), details))
            return lastRecorded;

        const detailsRecord = {
            ...details,
            listed: lastRecorded ? lastRecorded.listed : toISOString(Date.now()),
            updated: toISOString(Date.now()),
        };

        await writeJson(pathToFile, detailsRecord);
        return detailsRecord;
    }

    async update(id: bcked.entity.Id): Promise<void> {
        const adapter = await this.getAdapterInstance("entities", id);
        await adapter.update();
    }
}

export class AssetAdapterProxy extends AdapterCache<bcked.asset.Adapter> {
    async getDetails(identifier: bcked.asset.Identifier): Promise<bcked.asset.DetailsRecord> {
        const assetId = toId(identifier);
        const pathToFile = path.join(PATHS.assets, assetId, PATHS.records, FILES.json.details);

        const lastRecorded = await readJson<bcked.asset.DetailsRecord>(pathToFile);

        if (lastRecorded && !isNewer(lastRecorded.updated, Date.now(), minInMs(10)))
            return lastRecorded;

        const adapter = await this.getAdapterInstance("assets", assetId);
        const details = await adapter.getDetails(lastRecorded);

        if (lastRecorded && _.isEqual(_.omit(lastRecorded, ["listed", "updated"]), details))
            return lastRecorded;

        const detailsRecord = {
            ...details,
            listed: lastRecorded ? lastRecorded.listed : toISOString(Date.now()),
            updated: toISOString(Date.now()),
        };

        await writeJson(pathToFile, detailsRecord);
        return detailsRecord;
    }

    async getPrice(identifier: bcked.asset.Identifier): Promise<bcked.asset.Price[]> {
        const assetId = toId(identifier);
        const csvPath = path.join(PATHS.assets, assetId, PATHS.records, FILES.csv.price);
        const lastRecorded = await getLatest<bcked.asset.Price>(csvPath);

        if (lastRecorded && !isNewer(lastRecorded.timestamp, Date.now(), minInMs(10)))
            return [lastRecorded];

        const adapter = await this.getAdapterInstance("assets", assetId);

        const price = await adapter.getPrice(lastRecorded);
        const entries = _.sortBy(price, "timestamp").filter((entry) =>
            isNewEntry(lastRecorded, entry, minInMs(10))
        );

        await writeToCsv(csvPath, toAsync(entries), "timestamp");

        return entries;
    }

    async getSupply(identifier: bcked.asset.Identifier): Promise<bcked.asset.Supply[]> {
        const assetId = toId(identifier);
        const csvPath = path.join(PATHS.assets, assetId, PATHS.records, FILES.csv.supply);
        const lastRecorded = await getLatest<bcked.asset.Supply>(csvPath);

        if (lastRecorded && !isNewer(lastRecorded.timestamp, Date.now(), minInMs(10)))
            return [lastRecorded];

        const adapter = await this.getAdapterInstance("assets", assetId);

        const supply = await adapter.getSupply(lastRecorded);
        const entries = _.sortBy(supply, "timestamp").filter((entry) =>
            isNewEntry(lastRecorded, entry, minInMs(10))
        );

        await writeToCsv(csvPath, toAsync(entries), "timestamp");

        return entries;
    }

    async getBacking(identifier: bcked.asset.Identifier): Promise<bcked.asset.Backing[]> {
        const assetId = toId(identifier);
        const csvPath = path.join(PATHS.assets, assetId, PATHS.records, FILES.csv.backing);
        const lastRecorded = await getLatest<bcked.asset.Backing>(csvPath);

        if (lastRecorded && !isNewer(lastRecorded.timestamp, Date.now(), minInMs(10)))
            return [lastRecorded];

        const adapter = await this.getAdapterInstance("assets", assetId);

        const backing = await adapter.getBacking(lastRecorded);
        const entries = _.sortBy(backing, "timestamp").filter((entry) =>
            isNewEntry(lastRecorded, entry, minInMs(10))
        );

        await writeToCsv(csvPath, toAsync(entries), "timestamp");

        return entries;
    }
}
