import { JsonResources } from "../utils/resources";
import { icons } from "./icons";

class Asset extends JsonResources {
    constructor() {
        super({
            name: "Assets",
            description: "Everything about assets",
            externalDocs: {
                description: "View on bcked.com",
                url: "https://bcked.com/assets",
            },
        });
    }

    @JsonResources.register({
        path: "/assets",
        summary: "Retrieve a list of assets",
        description: "Get a list of asset IDs and references",
        type: "Assets",
        // TODO write schema
        schema: {},
    })
    async index(ids: bcked.asset.Id[]) {
        return {
            $id: "/assets",
            assets: ids.map((id) => ({
                $ref: `/assets/${id}`,
            })),
        };
    }

    @JsonResources.register({
        path: "/assets/{id}",
        summary: "Get an asset",
        description: "Get an asset by its ID",
        type: "Asset",
        // TODO write schema
        schema: {},
    })
    async asset(id: bcked.asset.Id) {
        return {
            $id: `/assets/${id}`,
            details: {
                $ref: `/assets/${id}/details`,
            },
            icons: {
                $ref: `/assets/${id}/icons`,
            },
            // price: {
            //     $ref: `/assets/${id}/price`,
            // },
            // supply: {
            //     $ref: `/assets/{id}/supply`,
            // },
            // mcap: {
            //     $ref: `/assets/{id}/mcap`,
            // },
            // backing: {
            //     $ref: `/assets/${id}/backing`,
            // },
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/details",
        summary: "Get details of an asset",
        description: "Get details of an asset by its ID",
        type: "AssetDetails",
        // TODO write schema
        schema: {},
    })
    async details(id: bcked.asset.Id, details: bcked.asset.DetailsRecord) {
        return {
            $id: `/assets/${id}/details`,
            name: details?.name,
            symbol: details?.symbol,
            identifier: {
                address: details?.identifier.address,
                // TODO Map to system ref
                system: details?.identifier.system,
            },
            assetClasses: details?.assetClasses,
            // TODO Map to entity refs
            // TODO make list instead?
            linkedEntities: details?.linkedEntities,
            reference: details?.reference,
            tags: details?.tags,
            listed: details?.listed,
            updated: details?.updated,
        };
    }

    @JsonResources.register({
        path: "/assets/{id}/icons",
        summary: "Get icons of an asset",
        description: "Get icons of an asset by its ID",
        type: "AssetIcons",
        // TODO write schema
        schema: {},
    })
    async icons(id: bcked.entity.Id) {
        return icons("assets", id);
    }
}

export const ASSET_RESOURCES = new Asset();
