/**
 * Tether Gold (XAUt): one token for one fine troy ounce of gold in physical bars, held by a custodian
 * for the token holders. The gold comes from the quarterly attestation reports of TG Commodities
 * (https://gold.tether.to/reports), added by scripts/attestations/update.sh. The reports cover
 * XAUt on all chains, almost all of it is on Ethereum.
 *
 * The supply is every minted token on Ethereum, from Tether's transparency data, including the
 * tokens Tether holds for sale: the reported gold covers those too.
 */
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { JsonApi } from "../../src/utils/requests";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Tether Gold",
    symbol: "XAUT",
    identifier: {
        address: "0x68749665FF8D2d112Fa859AA293F07A622782F38",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "tether",
    },
    reference: "https://gold.tether.to/",
    tags: ["real-world-asset"],
    backing: {
        method: "reports",
        description:
            "Quarterly attestation reports of TG Commodities, which state the fine troy ounces of gold the custodian holds for all XAUt tokens.",
        reference: "https://gold.tether.to/reports",
        reports: "asset",
    },
};

interface TetherTransparency {
    data: { xaut: { totaltokens_eth: string | number } };
}

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;
    tether: JsonApi;

    constructor() {
        this.api = new ApiProxy();
        this.tether = new JsonApi("https://app.tether.to");
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const response = await this.tether.fetchJson<TetherTransparency>("/transparency.json");
        const minted = Number(response.data.xaut.totaltokens_eth);
        if (!Number.isFinite(minted) || minted <= 0) return [];
        return [
            {
                timestamp: toISOString(Date.now()),
                circulating: null,
                burned: null,
                total: minted,
                issued: minted,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        // Written by the attestation workflow from the reports.
        return [];
    }
}
