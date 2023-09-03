/**
 * The WBTC backing is queried using the WBTC API.
 * All attribution goes to the WBTC API.
 */
import { utils } from "ethers";
import { ApiProxy } from "../../src/crawler/apis/proxy";
import { ChainProxy } from "../../src/crawler/chains/proxy";
import { JsonApi } from "../../src/utils/requests";
import { toISOString } from "../../src/utils/string_formatting";

const details: bcked.asset.Details = {
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    identifier: {
        address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        system: "ethereum",
    },
    assetClasses: ["cryptocurrency", "derivative"],
    linkedEntities: {
        issuer: "bitgo",
    },
    reference: "https://wbtc.network/dashboard/audit",
    tags: ["bridged-asset"],
};

interface wbtcApiTokenResponse {
    id: string;
    token: string;
    name: string;
    symbol: string;
    supply: string;
    holdings: string;
}

export default class Adapter implements bcked.asset.Adapter {
    api: ApiProxy;
    chain: ChainProxy;
    wbtcApi: JsonApi;

    constructor() {
        this.api = new ApiProxy();
        this.chain = new ChainProxy();
        this.wbtcApi = new JsonApi("https://wbtc.network/api");
    }

    async getDetails(): Promise<bcked.asset.Details> {
        return details;
    }

    async getPrice(): Promise<bcked.asset.Price[]> {
        const price = await this.api.getPrice(details.identifier);
        return price ? [price] : [];
    }

    async getSupply(): Promise<bcked.asset.Supply[]> {
        const { timestamp, issued, burned } = await this.chain.getSupply(
            details.identifier.address,
            details.identifier.system
        );
        return [
            {
                timestamp,
                circulating: null,
                burned: burned ?? null,
                total: burned ? issued - burned : issued,
                issued: issued,
                max: null,
            },
        ];
    }

    async getBacking(): Promise<bcked.asset.Backing[]> {
        // As an alternative to relying on the wbtc API, one could do the following:
        // Track list (json or yml) of custodian addresses.
        // Load and update custodian list from: https://wbtc.network/api/chain/eth/token/wbtc/addresses?type=custodial
        // Query custodian addresses for holdings via Blockstream API: https://github.com/Blockstream/esplora/blob/master/API.md

        const response = await this.wbtcApi.fetchJson<wbtcApiTokenResponse>(
            "/chain/eth/token/wbtc"
        );
        // Convert holdings from satoshis to bitcoins
        const holdings = parseFloat(utils.formatUnits(response.holdings, 8));
        return [
            {
                timestamp: toISOString(Date.now()),
                underlying: {
                    "bitcoin:BTC": holdings,
                },
            },
        ];
    }
}
