import { InstanceProxy } from "../primitive/instance_proxy";
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
            return this.getInstance(system).getBalance(address, token, system);
        } catch (error) {
            console.log(error);
            throw Error(`Error for query of balance of ${system}:${token} on address ${address}.`);
        }
    }

    async getSupply(
        token: bcked.asset.Address,
        system: bcked.system.Id
    ): Promise<bcked.query.Supply> {
        try {
            return this.getInstance(system).getSupply(token, system);
        } catch (error) {
            console.log(error);
            throw Error(`Error for query of supply of ${system}:${token}.`);
        }
    }
}
