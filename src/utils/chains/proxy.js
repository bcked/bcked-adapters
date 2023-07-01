"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainProxy = void 0;
const instance_proxy_1 = require("../primitive/instance_proxy");
const evm_1 = require("./evm");
const solana_1 = require("./solana");
class ChainProxy extends instance_proxy_1.InstanceProxy {
    constructor() {
        super({
            bsc: evm_1.EVMChain,
            ethereum: evm_1.EVMChain,
            moonbeam: evm_1.EVMChain,
            moonriver: evm_1.EVMChain,
            polygon: evm_1.EVMChain,
            arbitrum: evm_1.EVMChain,
            solana: solana_1.SolanaChain,
        });
    }
    async getDecimals(token, system) {
        return this.getInstance(system).getDecimals(token, system);
    }
    async getBalance(address, token, system) {
        try {
            return this.getInstance(system).getBalance(address, token, system);
        }
        catch (error) {
            console.log(error);
            throw Error(`Error for query of balance of ${system}:${token} on address ${address}.`);
        }
    }
    async getSupply(token, system) {
        try {
            return this.getInstance(system).getSupply(token, system);
        }
        catch (error) {
            console.log(error);
            throw Error(`Error for query of supply of ${system}:${token}.`);
        }
    }
}
exports.ChainProxy = ChainProxy;
//# sourceMappingURL=proxy.js.map