/**
 * Provides an interface to the Etherscan API.
 * All attribution goes to the [Etherscan API](https://etherscan.io/apis).
 * For more details on the API check out the [API Documentation](https://docs.etherscan.io/api-endpoints/).
 */
import { formatEther } from "ethers";
import { JsonApi, joinOptions } from "../../utils/requests";
import { toISOString } from "../../utils/string_formatting";

interface Error {
    status: "0";
    message: "NOTOK";
    result: string;
}

interface Success<T> {
    status: "1";
    message: "OK";
    result: T;
}

type Response<T> = Success<T> | Error;

interface EthSupply {
    EthSupply: string;
    Eth2Staking: string;
    BurntFees: string;
    WithdrawnTotal: string;
}

interface EthPrice {
    ethbtc: string;
    ethbtc_timestamp: string;
    ethusd: string;
    ethusd_timestamp: string;
}

export class Etherscan {
    api: JsonApi;

    constructor() {
        this.api = new JsonApi(`https://api.etherscan.io`);
        // API V1 was shut down in August 2025. V2 needs the chain id (1 = Ethereum mainnet).
    }

    private getUrl(module: string, action: string, options?: Record<string, string>): string {
        const opt = options ? "&" + joinOptions(options) : "";
        return `/v2/api?chainid=1&module=${module}&action=${action}${opt}&apikey=${process.env["ETHERSCAN_API_KEY"]}`;
    }

    private async fetch<T>(
        module: string,
        action: string,
        options?: Record<string, string>
    ): Promise<T> {
        const url = this.getUrl(module, action, options);
        const response = await this.api.fetchJson<Response<T>>(url);
        if (response.status == "1") {
            return response.result;
        } else {
            throw new Error(
                `Failed to fetch module ${module} action ${action}: ${response.result}`
            );
        }
    }

    async getEthSupply(): Promise<bcked.query.Supply> {
        const response = await this.fetch<EthSupply>("stats", "ethsupply2");
        const burnedFees = BigInt(response.BurntFees);
        const eth2Staking = BigInt(response.Eth2Staking);
        const ethSupply = BigInt(response.EthSupply);

        return {
            timestamp: toISOString(Date.now()),
            burned: parseFloat(formatEther(burnedFees)),
            issued: parseFloat(formatEther(ethSupply + eth2Staking)),
        };
    }

    async getEthPrice(): Promise<bcked.asset.Price> {
        const ethPrice = await this.fetch<EthPrice>("stats", "ethprice");
        return {
            timestamp: toISOString(parseInt(ethPrice.ethusd_timestamp) * 1000),
            usd: parseFloat(ethPrice.ethusd),
        };
    }
}
