import { decodeBase58, formatUnits, getAddress, sha256, toBeHex } from "ethers";
import { toISOString } from "../../utils/string_formatting";
import { EVMChain } from "./evm";

/**
 * Tron through TronGrid's Ethereum-compatible JSON-RPC (https://developers.tron.network/reference/json-rpc),
 * run by the TRON DAO. Token contracts on Tron follow TRC-20, the same interface as ERC-20, so the
 * EVM reads work once an address is converted from Tron's base58 form (T...) to hex. TronGrid only
 * answers calls at the latest block, so Tron has no history rebuild.
 */
export class TronChain extends EVMChain {
    override async getDecimals(token: bcked.asset.Address, system: bcked.system.Id) {
        return super.getDecimals(toHex(token), system);
    }

    override async getBalance(
        address: string,
        token: bcked.asset.Address | null,
        system: bcked.system.Id
    ) {
        if (token == null) {
            // TRX has 6 decimals (sun), not the 18 of ether.
            const sun = await this.send<string>(
                "eth_getBalance",
                [toHex(address), "latest"],
                system
            );
            return { timestamp: toISOString(Date.now()), balance: parseFloat(formatUnits(sun, 6)) };
        }
        return super.getBalance(toHex(address), toHex(token), system);
    }

    override async getBurned(token: bcked.asset.Address | null, system: bcked.system.Id) {
        return super.getBurned(token && toHex(token), system);
    }

    override async getTokenSupply(token: bcked.asset.Address, system: bcked.system.Id) {
        return super.getTokenSupply(toHex(token), system);
    }

    override async getSupply(token: bcked.asset.Address, system: bcked.system.Id) {
        return super.getSupply(toHex(token), system);
    }

    override async call<T>(
        address: string,
        signature: string,
        args: unknown[],
        system: bcked.system.Id,
        blockTag?: number
    ): Promise<T> {
        if (blockTag !== undefined) throw Error("TronGrid only answers calls at the latest block.");
        return super.call<T>(toHex(address), signature, args, system);
    }
}

/**
 * Hex form (0x...) of a Tron address. A base58 address is 0x41, the 20 address bytes and a 4-byte
 * checksum (the start of the double SHA-256 of the rest). Hex addresses pass through.
 */
export function toHex(address: string): string {
    if (address.startsWith("0x")) return address;
    const bytes = toBeHex(decodeBase58(address), 25);
    const body = bytes.slice(0, 44);
    if (!body.startsWith("0x41")) throw Error(`Not a Tron address: ${address}`);
    if (sha256(sha256(body)).slice(2, 10) !== bytes.slice(44))
        throw Error(`Bad checksum in Tron address: ${address}`);
    return getAddress("0x" + body.slice(4));
}
