import {
    Contract,
    FunctionFragment,
    JsonRpcProvider,
    Network,
    formatEther,
    formatUnits,
} from "ethers";
import _ from "lodash";

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
    base: "https://base-rpc.publicnode.com",
    robinhood: "https://rpc.mainnet.chain.robinhood.com",
};

const CHAIN_IDS: Record<string, number> = {
    bsc: 56,
    ethereum: 1,
    moonbeam: 1284,
    moonriver: 1285,
    polygon: 137,
    arbitrum: 42161,
    base: 8453,
    robinhood: 4663,
};

export class EVMChain implements bcked.query.ChainModule {
    private _providers: Record<string, JsonRpcProvider> = {};
    private _tokenContracts: Record<string, Contract> = {};

    private getProvider(chain: string): JsonRpcProvider {
        if (chain in this._providers) return this._providers[chain]!;

        // ethers v6 batches concurrent JSON-RPC calls into one request by default.
        // A static network skips network detection, which otherwise retries in the background.
        const network = Network.from(CHAIN_IDS[chain]);
        const provider = new JsonRpcProvider(this.getRpcUrl(chain, true), network, {
            staticNetwork: network,
        });
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

    private async _getDecimals(contract: Contract): Promise<bigint> {
        return (await contract.getFunction("decimals")()) as bigint;
    }

    async getDecimals(
        token: bcked.asset.Address,
        system: bcked.system.Id
    ): Promise<bcked.query.Decimals> {
        const contract = this.getTokenContract(token, system);
        const decimals = await this._getDecimals(contract);
        return {
            timestamp: toISOString(Date.now()),
            decimals: Number(decimals),
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
                const balance = await provider.getBalance(address);
                return {
                    timestamp: toISOString(Date.now()),
                    balance: parseFloat(formatEther(balance)),
                };
            } else {
                const contract = this.getTokenContract(token, system);
                const [balance, decimals] = await Promise.all([
                    contract.getFunction("balanceOf")(address) as Promise<bigint>,
                    this._getDecimals(contract),
                ]);
                return {
                    timestamp: toISOString(Date.now()),
                    balance: parseFloat(formatUnits(balance, decimals)),
                };
            }
        } catch (error) {
            console.log(error);
            throw Error(`Error for query of balance of ${system}:${token} on address ${address}.`, {
                cause: error,
            });
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
        const [supply, decimals] = await Promise.all([
            contract.getFunction("totalSupply")() as Promise<bigint>,
            this._getDecimals(contract),
        ]);
        return parseFloat(formatUnits(supply, decimals));
    }

    async getSupply(
        token: bcked.asset.Address,
        system: bcked.system.Id
    ): Promise<bcked.query.Supply> {
        try {
            const [burned, issued] = await Promise.all([
                this.getBurned(token, system),
                this.getTokenSupply(token, system),
            ]);
            return { timestamp: toISOString(Date.now()), burned, issued };
        } catch (error) {
            console.log(error);
            throw Error(`Error for query of supply of ${system}:${token}.`, { cause: error });
        }
    }

    /** Sends a raw JSON-RPC request, e.g. a provider-specific method like alchemy_getAssetTransfers. */
    async send<T>(method: string, params: unknown[], system: bcked.system.Id): Promise<T> {
        return (await this.getProvider(system).send(method, params)) as T;
    }

    /**
     * Calls a view function of a contract, e.g. `call(vat, "function debt() view returns (uint256)", [])`.
     * Returns the raw result, bigints stay bigints.
     */
    async call<T>(
        address: string,
        signature: string,
        args: unknown[],
        system: bcked.system.Id
    ): Promise<T> {
        const fragment = FunctionFragment.from(signature);
        const contract = new Contract(address, [fragment], this.getProvider(system));
        try {
            return (await contract.getFunction(fragment.name)(...args)) as T;
        } catch (error) {
            throw Error(`Error for call of ${fragment.name} on ${system}:${address}.`, {
                cause: error,
            });
        }
    }
}
