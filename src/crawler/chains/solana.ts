import {
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    getScaledUiAmountConfig,
    unpackAccount,
    unpackMint,
} from "@solana/spl-token";
import { Connection, PublicKey, type TokenAmount } from "@solana/web3.js";
import { format, toISOString } from "../../utils/string_formatting";

const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/{ALCHEMY_SOLANA}";

function formatUnits(value: string | number | bigint, decimals: string | number | bigint): string {
    const _value = BigInt(value);
    const _decimals = BigInt(decimals);
    const multiplier = BigInt(10) ** _decimals;

    const whole = _value / multiplier;
    const fraction = _value % multiplier;
    // The fraction keeps its leading zeros: 105 with 2 decimals is 1.05.
    return `${whole}.${fraction.toString().padStart(Number(_decimals), "0")}`;
}

export class SolanaChain implements bcked.query.ChainModule {
    private _connection: Connection;

    constructor() {
        this._connection = new Connection(this.getRpcUrl(true));
    }

    private getRpcUrl(replace = false): string {
        return replace
            ? format(RPC_URL, { ALCHEMY_SOLANA: process.env["ALCHEMY_SOLANA"]! })
            : RPC_URL;
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
        const [accounts, decimals] = await Promise.all([
            this._connection.getTokenAccountsByOwner(address, { mint: token }),
            this._getDecimals(token),
        ]);

        const account = accounts.value[0]?.account;
        const amount = unpackAccount(
            address,
            account ? { ...account, data: Buffer.from(account.data) } : null
        ).amount;

        return {
            timestamp: toISOString(Date.now()),
            balance: parseFloat(formatUnits(amount, decimals)),
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

    /** Raw token amount at an address: a token account of the mint, or all accounts of an owner. */
    private async _rawBalance(address: PublicKey, mint: PublicKey): Promise<bigint> {
        // Keys are compared as base58: the token layouts decode keys with another web3.js version.
        const programs = [TOKEN_PROGRAM_ID.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58()];
        const info = await this._connection.getAccountInfo(address);
        if (info && programs.includes(info.owner.toBase58())) {
            const account = unpackAccount(
                address,
                { ...info, data: Buffer.from(info.data) },
                info.owner
            );
            return account.mint.toBase58() == mint.toBase58() ? account.amount : 0n;
        }
        const accounts = await this._connection.getTokenAccountsByOwner(address, { mint });
        let amount = 0n;
        for (const { pubkey, account } of accounts.value) {
            amount += unpackAccount(
                pubkey,
                { ...account, data: Buffer.from(account.data) },
                account.owner
            ).amount;
        }
        return amount;
    }

    /**
     * Supply of a mint in UI units, and the part held at the `locked` addresses (token accounts or
     * their owners). For a Token-2022 mint with the Scaled UI Amount extension (rebasing tokens such
     * as xStocks) the raw amounts are multiplied by the mint's current multiplier.
     */
    async getScaledSupply(
        token: bcked.asset.Address,
        locked: string[] = []
    ): Promise<{ issued: number; locked: number }> {
        const mint = new PublicKey(token);
        const info = await this._connection.getAccountInfo(mint);
        if (!info) throw Error(`No mint account for ${token} on Solana.`);
        const mintInfo = unpackMint(mint, { ...info, data: Buffer.from(info.data) }, info.owner);
        const balances = await Promise.all(
            locked.map((address) => this._rawBalance(new PublicKey(address), mint))
        );
        const config = getScaledUiAmountConfig(mintInfo);
        let multiplier = 1;
        if (config) {
            const now = Date.now() / 1000;
            multiplier =
                now >= Number(config.newMultiplierEffectiveTimestamp)
                    ? config.newMultiplier
                    : config.multiplier;
        }
        const ui = (raw: bigint) => parseFloat(formatUnits(raw, mintInfo.decimals)) * multiplier;
        return {
            issued: ui(mintInfo.supply),
            locked: ui(balances.reduce((sum, amount) => sum + amount, 0n)),
        };
    }
}
