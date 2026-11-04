/**
 * XRP Ledger, read through Honeycluster's public JSON-RPC (https://honeycluster.io/), a full-history
 * cluster listed among the XRP Ledger's public servers (https://xrpl.org/docs/tutorials/public-servers).
 *
 * A token on the XRP Ledger is an issued currency, identified by its currency code and its issuer
 * account. Its address here is "<currency>.<issuer>", e.g. "RLUSD.rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De".
 */
import Axios from "axios";
import axiosRetry, { exponentialDelay, isRetryableError } from "axios-retry";
import { toISOString } from "../../utils/string_formatting";

export const XRPL_RPC_URL = "https://honeycluster.io/";

/** Splits "<currency>.<issuer>" into the issuer and the currency code as the ledger stores it. */
export function parseXrplToken(token: bcked.asset.Address): { currency: string; issuer: string } {
    const [code, issuer] = token.split(".", 2);
    if (!code || !issuer) throw Error(`XRP Ledger token ${token} is not "<currency>.<issuer>".`);
    // Codes longer than three characters are stored as 40 hex digits, padded with zeros.
    const currency =
        code.length == 3
            ? code
            : Buffer.from(code, "ascii").toString("hex").toUpperCase().padEnd(40, "0");
    return { currency, issuer };
}

export class XrplChain implements bcked.query.ChainModule {
    private api = Axios.create({ baseURL: XRPL_RPC_URL });

    constructor() {
        // The requests only read, so they are retried like GET requests.
        axiosRetry(this.api, { retryDelay: exponentialDelay, retryCondition: isRetryableError });
    }

    async request<T>(method: string, params: Record<string, unknown>): Promise<T> {
        const response = await this.api.post("", { method, params: [params] });
        const result = response.data?.result;
        if (result?.status != "success") {
            throw Error(`XRP Ledger ${method} failed: ${JSON.stringify(result ?? response.data)}`);
        }
        return result as T;
    }

    async getDecimals(): Promise<bcked.query.Decimals> {
        // Issued currencies have no fixed decimals. Amounts are decimal strings.
        return { timestamp: toISOString(Date.now()), decimals: 0 };
    }

    async getBalance(
        address: string,
        token: bcked.asset.Address | null
    ): Promise<bcked.query.Balance> {
        if (token == null) {
            const result = await this.request<{ account_data: { Balance: string } }>(
                "account_info",
                { account: address, ledger_index: "validated" }
            );
            return {
                timestamp: toISOString(Date.now()),
                balance: Number(result.account_data.Balance) / 1e6,
            };
        }
        const { currency, issuer } = parseXrplToken(token);
        const result = await this.request<{ lines: { currency: string; balance: string }[] }>(
            "account_lines",
            { account: address, peer: issuer, ledger_index: "validated" }
        );
        const line = result.lines.find((line) => line.currency == currency);
        return { timestamp: toISOString(Date.now()), balance: Number(line?.balance ?? 0) };
    }

    /**
     * Issued supply of a token: the issuer's obligations in the currency, the sum of all trust line
     * balances held against the issuer. Tokens returned to the issuer are no longer issued.
     */
    async getSupply(token: bcked.asset.Address): Promise<bcked.query.Supply> {
        const { currency, issuer } = parseXrplToken(token);
        const result = await this.request<{ obligations?: Record<string, string> }>(
            "gateway_balances",
            { account: issuer, ledger_index: "validated", strict: true }
        );
        const obligation = result.obligations?.[currency];
        if (obligation == undefined) throw Error(`No obligations in ${currency} for ${issuer}.`);
        return { timestamp: toISOString(Date.now()), burned: null, issued: Number(obligation) };
    }
}
