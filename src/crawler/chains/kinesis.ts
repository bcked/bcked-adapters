/**
 * Kinesis blockchain, read through the public Horizon API that Kinesis runs for each of its two
 * networks (the endpoints of its explorer, https://explorer.kinesis.money/). Kinesis is a fork of the
 * Stellar network. KAU (gold) and KAG (silver) are the native coins of two separate ledgers, so the
 * address of an asset here is the coin, e.g. "KAG", and selects the ledger.
 *
 * Kinesis mints a coin when metal is added and burns it on redemption. Horizon reports the coins in
 * circulation, minted less redeemed, at each ledger (/coin_in_circulation/ledger/<sequence>).
 */
import Axios from "axios";
import axiosRetry, { exponentialDelay, isRetryableError } from "axios-retry";
import { toISOString } from "../../utils/string_formatting";

export const KINESIS_HORIZON: Record<string, string> = {
    KAU: "https://kau-mainnet.kinesisgroup.io",
    KAG: "https://kag-mainnet.kinesisgroup.io",
};

/** Coins in circulation as Horizon reports them at a ledger. */
export interface Circulation {
    circulation: string;
    mint: string;
    redemption: string;
    last_ledger_timestamp: string;
    last_ledger: number;
}

export class KinesisChain implements bcked.query.ChainModule {
    private api = Axios.create();

    constructor() {
        axiosRetry(this.api, { retryDelay: exponentialDelay, retryCondition: isRetryableError });
    }

    private horizon(coin: bcked.asset.Address): string {
        const url = KINESIS_HORIZON[coin];
        if (!url) throw Error(`Unknown Kinesis coin ${coin}.`);
        return url;
    }

    async getDecimals(): Promise<bcked.query.Decimals> {
        // Amounts are decimal strings with 7 decimals, as on Stellar.
        return { timestamp: toISOString(Date.now()), decimals: 7 };
    }

    async getBalance(
        address: string,
        token: bcked.asset.Address | null
    ): Promise<bcked.query.Balance> {
        if (token == null) throw Error("A Kinesis balance needs the coin (KAU or KAG).");
        const { data } = await this.api.get<{
            balances: { asset_type: string; balance: string }[];
        }>(`${this.horizon(token)}/accounts/${address}`);
        const native = data.balances.find((balance) => balance.asset_type == "native");
        return { timestamp: toISOString(Date.now()), balance: Number(native?.balance ?? 0) };
    }

    /** Coins in circulation at the latest ledger: all coins minted less those redeemed. */
    async getSupply(token: bcked.asset.Address): Promise<bcked.query.Supply> {
        const horizon = this.horizon(token);
        const { data: root } = await this.api.get<{
            history_latest_ledger: number;
            history_latest_ledger_closed_at: string;
        }>(`${horizon}/`);
        const { data } = await this.api.get<Circulation>(
            `${horizon}/coin_in_circulation/ledger/${root.history_latest_ledger}`
        );
        return {
            timestamp: toISOString(root.history_latest_ledger_closed_at),
            burned: null,
            issued: Number(data.circulation),
        };
    }
}
