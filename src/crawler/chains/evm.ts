import { providers } from "@0xsequence/multicall";
import { Contract, providers as ethersProviders, utils, type BigNumber } from "ethers";
import _ from "lodash";

import type { MulticallProvider } from "@0xsequence/multicall/dist/declarations/src/providers";
import { toId } from "../../utils/helper";
import { format, toISOString } from "../../utils/string_formatting";

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

const RPC_URLS: Record<string, string> = {
    bsc: "https://bsc-dataseed3.binance.org/",
    ethereum: "https://eth-mainnet.g.alchemy.com/v2/{ALCHEMY_ETHEREUM}",
    moonbeam: "https://moonbeam.public.blastapi.io", //'https://1rpc.io/glmr', //'https://rpc.api.moonbeam.network',
    moonriver: "https://rpc.api.moonriver.moonbeam.network",
    polygon: "https://polygon-mainnet.g.alchemy.com/v2/{ALCHEMY_POLYGON}",
    arbitrum: "https://arb-mainnet.g.alchemy.com/v2/{ALCHEMY_ARBITRUM}",
};

export class EVMChain implements bcked.query.ChainModule {
    private _providers: Record<string, MulticallProvider> = {};
    private _tokenContracts: Record<string, Contract> = {};

    private getProvider(chain: string): MulticallProvider {
        if (chain in this._providers) return this._providers[chain]!;

        const p = new ethersProviders.JsonRpcProvider(this.getRpcUrl(chain, true));
        const provider = new providers.MulticallProvider(p);
        this._providers[chain] = provider;
        return provider;
    }

    private getTokenContract(token: bcked.asset.Address, system: bcked.system.Id): Contract {
        const id = toId({ address: token, system });
        if (id in this._tokenContracts) return this._tokenContracts[id]!;

        const provider = this.getProvider(system);
        const contract = new Contract(token, Object.values(TOKEN_ABI), provider);
        this._tokenContracts[id] = contract;
        return contract;
    }

    private getRpcUrl(chain: bcked.system.Id, replace = false): string {
        const url = RPC_URLS[chain];
        if (!url) {
            throw Error(`EVM chain has no configuration for chain: ${chain}`);
        }
        return replace
            ? format(url, {
                  ALCHEMY_ETHEREUM: process.env["ALCHEMY_ETHEREUM"]!,
                  ALCHEMY_POLYGON: process.env["ALCHEMY_POLYGON"]!,
                  ALCHEMY_ARBITRUM: process.env["ALCHEMY_ARBITRUM"]!,
              })
            : url;
    }

    private async _getDecimals(contract: Contract): Promise<BigNumber> {
        const decimals: Promise<BigNumber> = contract["decimals"]();
        return await decimals;
    }

    async getDecimals(
        token: bcked.asset.Address,
        system: bcked.system.Id
    ): Promise<bcked.query.Decimals> {
        const contract = this.getTokenContract(token, system);
        const decimals = await this._getDecimals(contract);
        return {
            timestamp: toISOString(Date.now()),
            decimals: decimals.toNumber(),
        };
    }

    async getBalance(
        address: string,
        token: bcked.asset.Address | null,
        system: bcked.system.Id
    ): Promise<bcked.query.Balance> {
        try {
            if (token == null) {
                const provider = this.getProvider(system);
                const balance: Promise<BigNumber> = provider.getBalance(address);
                return {
                    timestamp: toISOString(Date.now()),
                    balance: parseFloat(utils.formatUnits(await balance, "ether")),
                };
            } else {
                const contract = this.getTokenContract(token, system);
                const balance: Promise<BigNumber> = contract["balanceOf"](address);
                const decimals: Promise<BigNumber> = this._getDecimals(contract);
                return {
                    timestamp: toISOString(Date.now()),
                    balance: parseFloat(utils.formatUnits(await balance, await decimals)),
                };
            }
        } catch (error) {
            console.log(error);
            throw Error(`Error for query of balance of ${system}:${token} on address ${address}.`);
        }
    }

    async getBurned(token: bcked.asset.Address | null, system: bcked.system.Id): Promise<number> {
        return _.sumBy(
            await Promise.all(
                BURN_ADDRESSES.map((address) => this.getBalance(address, token, system))
            ),
            "balance"
        );
    }

    async getTokenSupply(token: bcked.asset.Address, system: bcked.system.Id): Promise<number> {
        const contract = this.getTokenContract(token, system);
        const supply: Promise<BigNumber> = contract["totalSupply"]();
        const decimals: Promise<BigNumber> = this._getDecimals(contract);
        return parseFloat(utils.formatUnits(await supply, await decimals));
    }

    async getSupply(
        token: bcked.asset.Address,
        system: bcked.system.Id
    ): Promise<bcked.query.Supply> {
        try {
            return {
                timestamp: toISOString(Date.now()),
                burned: await this.getBurned(token, system),
                issued: await this.getTokenSupply(token, system),
            };
        } catch (error) {
            console.log(error);
            throw Error(`Error for query of supply of ${system}:${token}.`);
        }
    }
}
