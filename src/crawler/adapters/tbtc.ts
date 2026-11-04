/**
 * tBTC by Threshold on every tracked chain. Threshold lists the contracts in its docs:
 * https://docs.threshold.network/contract-addresses/tbtc
 *
 * tBTC is minted on Ethereum against bitcoin deposited with the tBTC Bridge. The Bridge credits each
 * deposit in its Bank once a proof of the Bitcoin transaction that moved it into a tBTC wallet is
 * accepted on-chain, and debits redemptions. The bitcoin behind minted tBTC is the Bank balance of the
 * TBTCVault, in satoshis.
 *
 * tBTC bridged to other chains is locked on Ethereum and minted on the other chain: in the Wormhole
 * Token Bridge (Arbitrum, Base, Solana and others), in StarkGate (Starknet) and in the Chainlink CCIP
 * Lock & Release pool. The Ethereum totalSupply therefore counts all tBTC once. Each chain gets the
 * share of the backing that matches its circulating supply.
 */
import { formatUnits } from "ethers";

import { ChainProxy } from "../chains/proxy";
import { toISOString } from "../../utils/string_formatting";

export const TBTC = "0x18084fbA666a33d37592fA2633fD49a74DD93a88";
export const TBTC_VAULT = "0x9C070027cdC9dc8F82416B2e5314E11DFb4FE3CD";
// The Bank of the tBTC Bridge, as returned by TBTCVault.bank().
export const TBTC_BANK = "0x65Fbae61ad2C8836fFbFB502A0dA41b0789D9Fc6";

// Hold the tBTC bridged from Ethereum to other chains. The Wormhole Token Bridge is the address
// returned by wormholeTokenBridge() of Threshold's L1BitcoinDepositor contracts. StarkGate and the
// CCIP pool are listed in Threshold's docs.
export const TBTC_LOCKED = [
    "0x3ee18B2214AFF97000D974cf647E7C347E8fa585", // Wormhole Token Bridge
    "0x2111A49ebb717959059693a3698872a0aE9866b9", // StarkGate bridge (Starknet)
    "0x03E342731c08FDDc34cFb43E91cB3a7e424ee0F6", // Chainlink CCIP Lock & Release pool
];

export const TBTC_BACKING_DESCRIPTION =
    "The bitcoin the tBTC Bridge has credited to the TBTCVault in its Bank on Ethereum, read from the chain every hour. The Bridge credits a deposit after an on-chain proof of the Bitcoin transaction into a tBTC wallet and debits redemptions. This is the Bridge's own record, the bitcoin addresses of the wallets are not read. Each chain gets the share of its circulating supply.";

/** Bitcoin credited to the TBTCVault by the Bridge's Bank. */
export async function tbtcReserve(chain: ChainProxy): Promise<number> {
    const sats = await chain.call<bigint>(
        TBTC_BANK,
        "function balanceOf(address) view returns (uint256)",
        [TBTC_VAULT],
        "ethereum"
    );
    return parseFloat(formatUnits(sats, 8));
}

/** Bitcoin behind a number of tBTC: the chain's share of the TBTCVault balance. */
export async function tbtcBacking(
    chain: ChainProxy,
    circulating: number
): Promise<bcked.asset.Backing> {
    const [reserve, { issued, burned }] = await Promise.all([
        tbtcReserve(chain),
        chain.getSupply(TBTC, "ethereum"),
    ]);
    const total = issued - (burned ?? 0);
    return {
        timestamp: toISOString(Date.now()),
        underlying: {
            "bitcoin:BTC": total > 0 ? (reserve * circulating) / total : 0,
        },
    };
}
