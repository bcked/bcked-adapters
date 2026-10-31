import { InstanceProxy } from "../../utils/instance_proxy";
import { EVMChain } from "./evm";
import { SolanaChain } from "./solana";

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
            solana: SolanaChain,
        });
    }

    /** Calls a view function of a contract. Only EVM chains support this. */
    async call<T>(
        address: string,
        signature: string,
        args: unknown[],
        system: bcked.system.Id
    ): Promise<T> {
        const instance = this.getInstance(system);
        if (!(instance instanceof EVMChain)) {
            throw Error(`Contract calls are not supported on ${system}.`);
        }
        return instance.call<T>(address, signature, args, system);
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
            throw Error(`Error for query of balance of ${system}:${token} on address ${address}.`, {
                cause: error,
            });
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
