"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVMChain = void 0;
const multicall_1 = require("@0xsequence/multicall");
const ethers_1 = require("ethers");
const lodash_1 = __importDefault(require("lodash"));
const helper_1 = require("../../utils/helper");
const string_formatting_1 = require("../../utils/string_formatting");
const BURN_ADDRESSES = [
    "0x000000000000000000000000000000000000dEaD",
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000002",
    "0x0000000000000000000000000000000000000003",
    "0x0000000000000000000000000000000000000004",
];
const TOKEN_ABI = {
    balanceOf: "function balanceOf(address owner) view returns (uint256)",
    totalSupply: "function totalSupply() view returns (uint256)",
    decimals: "function decimals() view returns (uint256)",
    symbol: "function symbol() view returns (string)",
};
const RPC_URLS = {
    bsc: "https://bsc-dataseed3.binance.org/",
    ethereum: "https://eth-mainnet.g.alchemy.com/v2/{ALCHEMY_ETHEREUM}",
    moonbeam: "https://moonbeam.public.blastapi.io",
    moonriver: "https://rpc.api.moonriver.moonbeam.network",
    polygon: "https://polygon-mainnet.g.alchemy.com/v2/{ALCHEMY_POLYGON}",
    arbitrum: "https://arb-mainnet.g.alchemy.com/v2/{ALCHEMY_ARBITRUM}",
};
class EVMChain {
    constructor() {
        this._providers = {};
        this._tokenContracts = {};
    }
    getProvider(chain) {
        if (chain in this._providers)
            return this._providers[chain];
        const p = new ethers_1.providers.JsonRpcProvider(this.getRpcUrl(chain, true));
        const provider = new multicall_1.providers.MulticallProvider(p);
        this._providers[chain] = provider;
        return provider;
    }
    getTokenContract(token, system) {
        const id = (0, helper_1.toId)({ address: token, system });
        if (id in this._tokenContracts)
            return this._tokenContracts[id];
        const provider = this.getProvider(system);
        const contract = new ethers_1.Contract(token, Object.values(TOKEN_ABI), provider);
        this._tokenContracts[id] = contract;
        return contract;
    }
    getRpcUrl(chain, replace = false) {
        const url = RPC_URLS[chain];
        if (!url) {
            throw Error(`EVM chain has no configuration for chain: ${chain}`);
        }
        return replace
            ? (0, string_formatting_1.format)(url, {
                ALCHEMY_ETHEREUM: process.env["ALCHEMY_ETHEREUM"],
                ALCHEMY_POLYGON: process.env["ALCHEMY_POLYGON"],
                ALCHEMY_ARBITRUM: process.env["ALCHEMY_ARBITRUM"],
            })
            : url;
    }
    async _getDecimals(contract) {
        const decimals = contract["decimals"]();
        return await decimals;
    }
    async getDecimals(token, system) {
        const contract = this.getTokenContract(token, system);
        const decimals = await this._getDecimals(contract);
        return {
            timestamp: (0, string_formatting_1.toISOString)(Date.now()),
            decimals: decimals.toNumber(),
        };
    }
    async getBalance(address, token, system) {
        try {
            if (token == null) {
                const provider = this.getProvider(system);
                const balance = provider.getBalance(address);
                return {
                    timestamp: (0, string_formatting_1.toISOString)(Date.now()),
                    balance: parseFloat(ethers_1.utils.formatUnits(await balance, "ether")),
                };
            }
            else {
                const contract = this.getTokenContract(token, system);
                const balance = contract["balanceOf"](address);
                const decimals = this._getDecimals(contract);
                return {
                    timestamp: (0, string_formatting_1.toISOString)(Date.now()),
                    balance: parseFloat(ethers_1.utils.formatUnits(await balance, await decimals)),
                };
            }
        }
        catch (error) {
            console.log(error);
            throw Error(`Error for query of balance of ${system}:${token} on address ${address}.`);
        }
    }
    async getBurned(token, system) {
        return lodash_1.default.sumBy(await Promise.all(BURN_ADDRESSES.map((address) => this.getBalance(address, token, system))), "balance");
    }
    async getTokenSupply(token, system) {
        const contract = this.getTokenContract(token, system);
        const supply = contract["totalSupply"]();
        const decimals = this._getDecimals(contract);
        return parseFloat(ethers_1.utils.formatUnits(await supply, await decimals));
    }
    async getSupply(token, system) {
        try {
            return {
                timestamp: (0, string_formatting_1.toISOString)(Date.now()),
                burned: await this.getBurned(token, system),
                issued: await this.getTokenSupply(token, system),
            };
        }
        catch (error) {
            console.log(error);
            throw Error(`Error for query of supply of ${system}:${token}.`);
        }
    }
}
exports.EVMChain = EVMChain;
//# sourceMappingURL=evm.js.map