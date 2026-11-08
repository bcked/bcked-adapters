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

// Alchemy's free tier limits compute units per second, so a burst can need a longer pause.
const RETRY_DELAYS = [1000, 3000, 8000, 20000];

/**
 * Runs a read and retries it after a pause if it fails. RPC providers reject bursts of requests
 * (rate limits), which shows up as failed calls.
 */
export async function retry<T>(read: () => Promise<T>): Promise<T> {
    for (const delay of RETRY_DELAYS) {
        try {
            return await read();
        } catch {
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    return read();
}

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
    ethereum: "https://eth-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
    moonbeam: "https://rpc.api.moonbeam.network",
    moonriver: "https://rpc.api.moonriver.moonbeam.network",
    polygon: "https://polygon-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
    arbitrum: "https://arb-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
    base: "https://mainnet.base.org",
    robinhood: "https://rpc.mainnet.chain.robinhood.com",
    avalanche: "https://avax-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
    xlayer: "https://rpc.xlayer.tech",
    ink: "https://rpc-gel.inkonchain.com",
    plume: "https://rpc.plume.org",
    tron: "https://api.trongrid.io/jsonrpc",
    tempo: "https://tempo-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
    rootstock: "https://rootstock-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
    monad: "https://monad-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
    plasma: "https://plasma-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
    mantle: "https://mantle-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
    bob: "https://bob-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
    sonic: "https://sonic-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
    pharos: "https://pharos-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
    linea: "https://linea-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
    soneium: "https://soneium-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
    sei: "https://sei-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}",
};

const NO_BATCH = new Set(["xlayer"]);

const CHAIN_IDS: Record<string, number> = {
    bsc: 56,
    ethereum: 1,
    moonbeam: 1284,
    moonriver: 1285,
    polygon: 137,
    arbitrum: 42161,
    base: 8453,
    robinhood: 4663,
    avalanche: 43114,
    plume: 98866,
    xlayer: 196,
    ink: 57073,
    tron: 728126428,
    tempo: 4217,
    rootstock: 30,
    monad: 143,
    plasma: 9745,
    mantle: 5000,
    bob: 60808,
    sonic: 146,
    pharos: 1672,
    linea: 59144,
    soneium: 1868,
    sei: 1329,
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
            // Some public RPCs do not accept batched requests.
            ...(NO_BATCH.has(chain) ? { batchMaxCount: 1 } : {}),
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
                  ALCHEMY_API_KEY: process.env["ALCHEMY_API_KEY"]!,
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
                // Retried like the token reads: Alchemy answers bursts with 429 (compute units per second).
                const balance = await retry(() => provider.getBalance(address));
                return {
                    timestamp: toISOString(Date.now()),
                    balance: parseFloat(formatEther(balance)),
                };
            } else {
                const contract = this.getTokenContract(token, system);
                const [balance, decimals] = await retry(() =>
                    Promise.all([
                        contract.getFunction("balanceOf")(address) as Promise<bigint>,
                        this._getDecimals(contract),
                    ])
                );
                return {
                    timestamp: toISOString(Date.now()),
                    balance: parseFloat(formatUnits(balance, decimals)),
                };
            }
        } catch (error) {
            console.log(error);
            throw Error(
                `Error for query of balance of ${system}:${token ?? "native"} on address ${address}.`,
                {
                    cause: error,
                }
            );
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
            const [burned, issued] = await retry(() =>
                Promise.all([this.getBurned(token, system), this.getTokenSupply(token, system)])
            );
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
        system: bcked.system.Id,
        blockTag?: number
    ): Promise<T> {
        const fragment = FunctionFragment.from(signature);
        const contract = new Contract(address, [fragment], this.getProvider(system));
        try {
            const overrides = blockTag === undefined ? [] : [{ blockTag }];
            return (await retry(() =>
                contract.getFunction(fragment.name)(...args, ...overrides)
            )) as T;
        } catch (error) {
            throw Error(`Error for call of ${fragment.name} on ${system}:${address}.`, {
                cause: error,
            });
        }
    }
}
