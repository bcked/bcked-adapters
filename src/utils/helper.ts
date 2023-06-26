import * as path from "path";

export function _toId(system: bcked.system.Id, address: bcked.asset.Address): bcked.asset.Id {
    return `${system}:${address}`;
}

export function toId(identifier: bcked.asset.Identifier): bcked.asset.Id {
    return _toId(identifier.system, identifier.address);
}

export function fromId(assetId: bcked.asset.Id): bcked.asset.Identifier {
    const [system, address] = assetId.split(":", 2);

    if (system == undefined || address == undefined)
        throw new Error(`Asset ID ${assetId} invalid.`);

    return { address, system };
}

export function getAssetRecordsPath(identifier: bcked.asset.Identifier): string {
    return path.resolve(`assets/${toId(identifier)}/records`);
}

export function getPriceCsvPath(identifier: bcked.asset.Identifier): string {
    return path.resolve(getAssetRecordsPath(identifier), "price.csv");
}

export function getSupplyCsvPath(identifier: bcked.asset.Identifier): string {
    return path.resolve(getAssetRecordsPath(identifier), "supply.csv");
}

export function getBackingCsvPath(identifier: bcked.asset.Identifier): string {
    return path.resolve(getAssetRecordsPath(identifier), "backing.csv");
}
