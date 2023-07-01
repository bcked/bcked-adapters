"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaChain = void 0;
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const string_formatting_1 = require("../primitive/string_formatting");
const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/{ALCHEMY_SOLANA}";
function formatUnits(value, decimals) {
    const _value = BigInt(value);
    const _decimals = BigInt(decimals);
    const multiplier = BigInt(10) ** _decimals;
    const whole = _value / multiplier;
    const fraction = _value % multiplier;
    return `${whole}.${fraction}`;
}
class SolanaChain {
    constructor() {
        this._connection = new web3_js_1.Connection(this.getRpcUrl(true));
    }
    getRpcUrl(replace = false) {
        return replace ? (0, string_formatting_1.format)(RPC_URL, { ALCHEMY_SOLANA: process.env.ALCHEMY_SOLANA }) : RPC_URL;
    }
    async _getDecimals(token) {
        const response = await this._connection.getTokenSupply(token);
        return response.value.decimals;
    }
    async getDecimals(token) {
        return {
            timestamp: (0, string_formatting_1.toISOString)(Date.now()),
            decimals: await this._getDecimals(new web3_js_1.PublicKey(token)),
        };
    }
    async _getBalance(address, token) {
        const accountPromise = this._connection.getTokenAccountsByOwner(address, {
            mint: token,
        });
        const decimalsPromise = this._getDecimals(token);
        const amount = (0, spl_token_1.unpackAccount)(address, (await accountPromise).value[0]?.account ?? null).amount;
        return {
            timestamp: (0, string_formatting_1.toISOString)(Date.now()),
            balance: parseFloat(formatUnits(amount, await decimalsPromise)),
        };
    }
    async getBalance(address, token) {
        return this._getBalance(new web3_js_1.PublicKey(address), new web3_js_1.PublicKey(token));
    }
    async getSupply(token) {
        const response = await this._connection.getTokenSupply(new web3_js_1.PublicKey(token));
        const ta = response.value;
        return {
            timestamp: (0, string_formatting_1.toISOString)(Date.now()),
            burned: null,
            issued: parseFloat(formatUnits(ta.amount, ta.decimals)),
        };
    }
}
exports.SolanaChain = SolanaChain;
//# sourceMappingURL=solana.js.map