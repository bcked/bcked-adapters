import { formatUnits } from "ethers";
import { format, toISOString } from "../../utils/string_formatting";

/**
 * Aptos through Alchemy's Aptos node API (the Aptos REST API, https://aptos.dev/build/apis). Tokens
 * on Aptos are fungible assets, named by their metadata object address. Supply, decimals and
 * balances come from view functions of the framework.
 */
const RPC_URL = "https://aptos-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}/v1";
const METADATA = "0x1::fungible_asset::Metadata";

export class AptosChain implements bcked.query.ChainModule {
    private async view<T>(fn: string, args: string[]): Promise<T> {
        const url = format(RPC_URL, { ALCHEMY_API_KEY: process.env["ALCHEMY_API_KEY"]! });
        const response = await fetch(`${url}/view`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ function: fn, type_arguments: [METADATA], arguments: args }),
        });
        if (!response.ok) throw Error(`Aptos view ${fn} failed: ${response.status}`);
        const [result] = (await response.json()) as [T];
        return result;
    }

    private async decimals(token: string): Promise<number> {
        return this.view<number>("0x1::fungible_asset::decimals", [token]);
    }

    async getDecimals(token: bcked.asset.Address): Promise<bcked.query.Decimals> {
        return { timestamp: toISOString(Date.now()), decimals: await this.decimals(token) };
    }

    async getBalance(
        address: string,
        token: bcked.asset.Address | null
    ): Promise<bcked.query.Balance> {
        if (token == null) throw Error("Native balances are not read on Aptos.");
        const [balance, decimals] = await Promise.all([
            this.view<string>("0x1::primary_fungible_store::balance", [address, token]),
            this.decimals(token),
        ]);
        return {
            timestamp: toISOString(Date.now()),
            balance: parseFloat(formatUnits(balance, decimals)),
        };
    }

    async getSupply(token: bcked.asset.Address): Promise<bcked.query.Supply> {
        // supply() returns an Option<u128>, which the API writes as { vec: [] } or { vec: [value] }.
        const [supply, decimals] = await Promise.all([
            this.view<{ vec: string[] }>("0x1::fungible_asset::supply", [token]),
            this.decimals(token),
        ]);
        const value = supply.vec[0];
        if (value === undefined) throw Error(`No supply for Aptos fungible asset ${token}`);
        return {
            timestamp: toISOString(Date.now()),
            burned: null,
            issued: parseFloat(formatUnits(value, decimals)),
        };
    }
}
