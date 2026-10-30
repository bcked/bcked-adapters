import { icons } from "../utils/icons";
import { JsonResources } from "../utils/openapi";
import { type DailySeries } from "../utils/series";

/**
 * Tokens: one product on several chains, e.g. USDT. Each chain is an asset (/assets/{id}), the token
 * combines them and holds the reserves reported for all chains together.
 */
class Token extends JsonResources {
    constructor() {
        super({
            name: "Tokens",
            description: "Products issued on several chains, combining their chain assets",
            externalDocs: {
                description: "View on bcked.com",
                url: "https://bcked.com/assets",
            },
        });
    }

    @JsonResources.register({
        path: "/tokens",
        summary: "Retrieve a list of tokens",
        description: "Get a list of token IDs and references",
        type: "Tokens",
        // TODO write schema
        schema: {},
    })
    async index(ids: bcked.token.Id[]) {
        return {
            $id: "/tokens",
            summary: { $ref: "/tokens/summary" },
            tokens: ids.map((id) => ({ $ref: `/tokens/${id}` })),
        };
    }

    @JsonResources.register({
        path: "/tokens/{id}",
        summary: "Get a token",
        description: "Get a token by its ID",
        type: "Token",
        // TODO write schema
        schema: {},
    })
    async token(id: bcked.token.Id) {
        return {
            $id: `/tokens/${id}`,
            details: { $ref: `/tokens/${id}/details` },
            icons: { $ref: `/tokens/${id}/icons` },
            assets: { $ref: `/tokens/${id}/assets` },
            series: { $ref: `/tokens/${id}/series` },
            reports: { $ref: `/tokens/${id}/reports` },
        };
    }

    @JsonResources.register({
        path: "/tokens/summary",
        summary: "Get a summary of all tokens",
        description:
            "Get details, chains and combined latest values of all tokens in one resource, including the relative change over 1, 7 and 30 days",
        type: "TokenSummary",
        // TODO write schema
        schema: {},
    })
    async summary(items: object[]) {
        return { $id: "/tokens/summary", tokens: items };
    }

    @JsonResources.register({
        path: "/tokens/{id}/details",
        summary: "Get details of a token",
        description: "Get details of a token by its ID",
        type: "TokenDetails",
        // TODO write schema
        schema: {},
    })
    async details(id: bcked.token.Id, details: bcked.token.DetailsRecord) {
        return {
            $id: `/tokens/${id}/details`,
            name: details.name,
            symbol: details.symbol,
            identifier: details.identifier,
            issuer: details.issuer,
            reference: details.reference,
            tags: details.tags,
            backing: details.backing ?? null,
            listed: details.listed,
            updated: details.updated,
        };
    }

    @JsonResources.register({
        path: "/tokens/{id}/icons",
        summary: "Get icons of a token",
        description: "Get icons of a token by its ID",
        type: "TokenIcons",
        // TODO write schema
        schema: {},
    })
    async icons(id: bcked.token.Id) {
        return icons("tokens", id);
    }

    @JsonResources.register({
        path: "/tokens/{id}/assets",
        summary: "Get the chain assets of a token",
        description: "Get the assets (one per chain) that make up a token",
        type: "TokenAssets",
        // TODO write schema
        schema: {},
    })
    async assets(id: bcked.token.Id, assetIds: bcked.asset.Id[]) {
        return {
            $id: `/tokens/${id}/assets`,
            assets: assetIds.map((assetId) => ({ $ref: `/assets/${assetId}` })),
        };
    }

    @JsonResources.register({
        path: "/tokens/{id}/series",
        summary: "Get daily series of a token",
        description:
            "Get the last value of each UTC day, added up over all chains, as [date, value] pairs. The collateralization ratio is the combined reserves over the combined market cap at the backing dates",
        type: "TokenSeries",
        // TODO write schema
        schema: {},
    })
    async series(id: bcked.token.Id, series: Record<string, unknown>) {
        return { $id: `/tokens/${id}/series`, ...series };
    }

    @JsonResources.register({
        path: "/tokens/{id}/reports",
        summary: "Get the reports behind a token's reserves",
        description:
            "Get how the reserves of all chains are obtained and every report they come from, with date, SHA-256 hash and download URL",
        type: "TokenReports",
        // TODO write schema
        schema: {},
    })
    async reports(
        id: bcked.token.Id,
        source: bcked.asset.BackingSource,
        reports: { report: string; file: string; sha256: string; url: string }[]
    ) {
        return { $id: `/tokens/${id}/reports`, source, reports };
    }
}

export const TOKEN_RESOURCES = new Token();
export type { DailySeries };
