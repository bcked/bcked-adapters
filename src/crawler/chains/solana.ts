import { unpackAccount } from "@solana/spl-token";
import { Connection, PublicKey, type TokenAmount } from "@solana/web3.js";
import { format, toISOString } from "../../utils/string_formatting";

const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/{ALCHEMY_SOLANA}";

function formatUnits(value: string | number | bigint, decimals: string | number | bigint): string {
    const _value = BigInt(value);
    const _decimals = BigInt(decimals);
    const multiplier = BigInt(10) ** _decimals;

    const whole = _value / multiplier;
    const fraction = _value % multiplier;
    return `${whole}.${fraction}`;
}

export class SolanaChain implements bcked.query.ChainModule {
    private _connection: Connection;

    constructor() {
        this._connection = new Connection(this.getRpcUrl(true));
    }

    private getRpcUrl(replace: boolean = false): string {
        return replace ? format(RPC_URL, { ALCHEMY_SOLANA: process.env.ALCHEMY_SOLANA! }) : RPC_URL;
    }

    private async _getDecimals(token: PublicKey): Promise<number> {
        const response = await this._connection.getTokenSupply(token);
        return response.value.decimals;
    }

    async getDecimals(token: bcked.asset.Address): Promise<bcked.query.Decimals> {
        return {
            timestamp: toISOString(Date.now()),
            decimals: await this._getDecimals(new PublicKey(token)),
        };
    }

    private async _getBalance(address: PublicKey, token: PublicKey): Promise<bcked.query.Balance> {
        const accountPromise = this._connection.getTokenAccountsByOwner(address, {
            mint: token,
        });
        const decimalsPromise = this._getDecimals(token);

        const amount = unpackAccount(
            address,
            (await accountPromise).value[0]?.account ?? null
        ).amount;

        return {
            timestamp: toISOString(Date.now()),
            balance: parseFloat(formatUnits(amount, await decimalsPromise)),
        };
    }

    async getBalance(address: string, token: bcked.asset.Address): Promise<bcked.query.Balance> {
        return this._getBalance(new PublicKey(address), new PublicKey(token));
    }

    async getSupply(token: bcked.asset.Address): Promise<bcked.query.Supply> {
        const response = await this._connection.getTokenSupply(new PublicKey(token));
        const ta: TokenAmount = response.value;
        return {
            timestamp: toISOString(Date.now()),
            burned: null, // TODO how to read out burned amount on SOL?
            issued: parseFloat(formatUnits(ta.amount, ta.decimals)),
        };
    }
}
