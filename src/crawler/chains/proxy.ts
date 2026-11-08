import { InstanceProxy } from "../../utils/instance_proxy";
import { AptosChain } from "./aptos";
import { EVMChain } from "./evm";
import { SolanaChain } from "./solana";
import { TronChain } from "./tron";
import { XrplChain } from "./xrpl";

export class ChainProxy
    extends InstanceProxy<bcked.query.ChainModule>
    implements bcked.query.ChainModule
{
    constructor() {
        super({
            bsc: EVMChain,
            ethereum: EVMChain,
            moonbeam: EVMChain,
            moonriver: EVMChain,
            polygon: EVMChain,
            arbitrum: EVMChain,
            base: EVMChain,
            robinhood: EVMChain,
            avalanche: EVMChain,
            plume: EVMChain,
            xlayer: EVMChain,
            ink: EVMChain,
            tempo: EVMChain,
            rootstock: EVMChain,
            monad: EVMChain,
            plasma: EVMChain,
            mantle: EVMChain,
            bob: EVMChain,
            sonic: EVMChain,
            pharos: EVMChain,
            linea: EVMChain,
            soneium: EVMChain,
            solana: SolanaChain,
            aptos: AptosChain,
            tron: TronChain,
            xrpl: XrplChain,
        });
    }

    /** Calls a view function of a contract. Only EVM chains support this. */
    async call<T>(
        address: string,
        signature: string,
        args: unknown[],
        system: bcked.system.Id,
        blockTag?: number
    ): Promise<T> {
        const instance = this.getInstance(system);
        if (!(instance instanceof EVMChain)) {
            throw Error(`Contract calls are not supported on ${system}.`);
        }
        return instance.call<T>(address, signature, args, system, blockTag);
    }

    /** Sends a raw JSON-RPC request. Only EVM chains support this. */
    async send<T>(method: string, params: unknown[], system: bcked.system.Id): Promise<T> {
        const instance = this.getInstance(system);
        if (!(instance instanceof EVMChain)) {
            throw Error(`JSON-RPC requests are not supported on ${system}.`);
        }
        return instance.send<T>(method, params, system);
    }

    async getDecimals(
        token: bcked.asset.Address,
        system: bcked.system.Id
    ): Promise<bcked.query.Decimals> {
        return this.getInstance(system).getDecimals(token, system);
    }

    async getBalance(
        address: string,
        token: bcked.asset.Address | null,
        system: bcked.system.Id
    ): Promise<bcked.query.Balance> {
        try {
            return await this.getInstance(system).getBalance(address, token, system);
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

    async getSupply(
        token: bcked.asset.Address,
        system: bcked.system.Id
    ): Promise<bcked.query.Supply> {
        try {
            return await this.getInstance(system).getSupply(token, system);
        } catch (error) {
            console.log(error);
            throw Error(`Error for query of supply of ${system}:${token}.`, { cause: error });
        }
    }
}
