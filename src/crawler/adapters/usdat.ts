/**
 * Saturn Dollar (USDat) on every tracked chain. Saturn lists the contracts in its docs:
 * https://saturncredit.gitbook.io/saturn-docs/operations-and-governance/key-addresses
 *
 * USDat is issued on Ethereum. The USDat contract holds PYUSDx as backing for USDat on all chains.
 * USDat bridged to other chains through Chainlink CCIP is locked on Ethereum and minted on the other
 * chain, so the Ethereum totalSupply counts all USDat once. The current pool comes from Chainlink's
 * TokenAdminRegistry (https://docs.chain.link/ccip/directory/mainnet/chain/mainnet); pools from
 * version 2.0 keep the tokens in a lockbox. Each chain gets the share of the PYUSDx that matches
 * its circulating USDat.
 */
import { ChainProxy } from "../chains/proxy";

export const USDAT = "0x23238f20b894f29041f48D88eE91131C395Aaa71";
export const PYUSDX = "0xeBDB0942cE16386Ab90718C7BD10C91CDb66b14d";
// The first Chainlink CCIP Lock & Release pool of USDat on Ethereum, replaced by a 2.0 pool.
const FIRST_BRIDGE_POOL = "0xA0dE671eb84dE9dEe1d311d996d25c41F63a0D86";
const TOKEN_ADMIN_REGISTRY = "0xb22764f98dD05c789929716D677382Df22C05Cb6";

/** USDat locked on Ethereum for the USDat on other chains: in the pools and the pool's lockbox. */
export async function usdatLocked(chain: ChainProxy): Promise<number> {
    const pool = await chain.call<string>(
        TOKEN_ADMIN_REGISTRY,
        "function getPool(address) view returns (address)",
        [USDAT],
        "ethereum"
    );
    const lockBox = await chain
        .call<string>(pool, "function getLockBox() view returns (address)", [], "ethereum")
        .catch(() => null);
    const holders = [...new Set([FIRST_BRIDGE_POOL, pool, lockBox].filter((a) => a !== null))];
    const balances = await Promise.all(
        holders.map((holder) => chain.getBalance(holder, USDAT, "ethereum"))
    );
    return balances.reduce((sum, { balance }) => sum + balance, 0);
}

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
