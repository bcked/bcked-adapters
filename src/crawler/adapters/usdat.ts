/**
 * Saturn Dollar (USDat) on every tracked chain. Saturn lists the contracts in its docs:
 * https://saturncredit.gitbook.io/saturn-docs/operations-and-governance/key-addresses
 *
 * USDat is issued on Ethereum. The USDat contract holds PYUSDx as backing for USDat on all chains.
 * USDat bridged to other chains through Chainlink CCIP is locked in the Lock & Release pool on
 * Ethereum and minted on the other chain, so the Ethereum totalSupply counts all USDat once.
 * Each chain gets the share of the PYUSDx that matches its circulating USDat.
 */
import { ChainProxy } from "../chains/proxy";

export const USDAT = "0x23238f20b894f29041f48D88eE91131C395Aaa71";
export const PYUSDX = "0xeBDB0942cE16386Ab90718C7BD10C91CDb66b14d";
// Holds the USDat bridged to other chains (Chainlink CCIP Lock & Release pool on Ethereum).
export const USDAT_BRIDGE_POOL = "0xA0dE671eb84dE9dEe1d311d996d25c41F63a0D86";

/** PYUSDx behind a number of USDat: the chain's share of the PYUSDx held by the USDat contract. */
export async function usdatBacking(
    chain: ChainProxy,
    circulating: number
): Promise<bcked.asset.Backing> {
    const [{ timestamp, balance }, { issued, burned }] = await Promise.all([
        chain.getBalance(USDAT, PYUSDX, "ethereum"),
        chain.getSupply(USDAT, "ethereum"),
    ]);
    const total = issued - (burned ?? 0);
    return {
        timestamp,
        underlying: {
            [`ethereum:${PYUSDX}`]: total > 0 ? (balance * circulating) / total : 0,
        },
    };
}
