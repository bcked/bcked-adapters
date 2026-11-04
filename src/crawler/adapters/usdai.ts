/**
 * USDai by USD.AI on every tracked chain. USD.AI lists the contracts in its docs:
 * https://docs.usd.ai/technical-overview/contract-addresses
 *
 * USDai is issued on Arbitrum. The USDai contract holds PayPal USD (PYUSD) on Arbitrum as backing for
 * USDai on all chains. USDai moves to other chains by burning on Arbitrum and minting on the other
 * chain. The USDai contract counts the USDai on other chains in bridgedSupply(), so the Arbitrum
 * totalSupply plus bridgedSupply is all USDai. Each chain gets the share of the PYUSD that matches its
 * supply.
 */
import { formatUnits } from "ethers";

import { ChainProxy } from "../chains/proxy";

export const USDAI = "0x0A1a1A107E45b7Ced86833863f482BC5f4ed82EF";
// PayPal USD on Arbitrum, the USDai base token since the USDai v1.4 upgrade (2026-01).
export const PYUSD_ARBITRUM = "0x46850aD61C2B7d64d08c9C754F45254596696984";

/** PYUSD behind a number of USDai: the chain's share of the PYUSD held by the USDai contract. */
export async function usdaiBacking(
    chain: ChainProxy,
    supply: number
): Promise<bcked.asset.Backing> {
    const [{ timestamp, balance }, { issued }, bridged] = await Promise.all([
        chain.getBalance(USDAI, PYUSD_ARBITRUM, "arbitrum"),
        chain.getSupply(USDAI, "arbitrum"),
        chain.call<bigint>(
            USDAI,
            "function bridgedSupply() view returns (uint256)",
            [],
            "arbitrum"
        ),
    ]);
    const total = issued + parseFloat(formatUnits(bridged, 18));
    return {
        timestamp,
        underlying: {
            [`arbitrum:${PYUSD_ARBITRUM}`]: total > 0 ? (balance * supply) / total : 0,
        },
    };
}
