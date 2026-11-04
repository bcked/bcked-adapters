/**
 * M by M0 on every tracked chain. M0 lists the contracts in the deployment files of its M Portal
 * repository: https://github.com/m0-platform/m-portal/tree/main/deployments
 *
 * M is minted on Ethereum by minters through the MinterGateway, against collateral that validators
 * confirm on-chain. M bridged to other chains is locked in the Hub Portal on Ethereum and minted by
 * the Spoke Portal on the other chain, so the Ethereum totalSupply counts all M once.
 *
 * The backing is the collateral the MinterGateway records for each active minter (collateralOf),
 * in US dollars with 6 decimals. It is 0 for a minter whose last update has expired. Its composition
 * is not recorded on-chain, so it is counted as rwa:undefined. Each chain gets the share of the
 * collateral that matches its circulating M.
 */
import { formatUnits } from "ethers";

import { ChainProxy } from "../chains/proxy";
import { toISOString } from "../../utils/string_formatting";

export const M = "0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b";
// Holds the M bridged from Ethereum to other chains (lock and release).
export const M_HUB_PORTAL = "0xD925C84b55E4e44a53749fF5F2a5A13F63D128fd";

const MINTER_GATEWAY = "function minterGateway() view returns (address)";
const IS_ACTIVE_MINTER = "function isActiveMinter(address) view returns (bool)";
const COLLATERAL_OF = "function collateralOf(address) view returns (uint240)";
const ACTIVE_OWED_M_OF = "function activeOwedMOf(address) view returns (uint240)";
const TOTAL_ACTIVE_OWED_M = "function totalActiveOwedM() view returns (uint240)";

// Minters approved by M0 governance, as listed in M0's governance app:
// https://github.com/m0-platform/ttg-frontend/blob/main/stores/actorsData.ts
const MINTERS = {
    MXON: "0x7F7489582b64ABe46c074A45d758d701c2CA5446",
    Bridge: "0xCD1394d24e1E404F9eB3609F872B0736bEcb9d74",
    "1Money": "0x1D5B695D13F231A605D231631C688Fb33477B249",
    MoonPay: "0x5d238f4eaC94dA0A635eE39fA389a4754395D5D9",
};

/** Collateral of all active minters in US dollars, read from the MinterGateway. */
export async function mCollateral(chain: ChainProxy): Promise<number> {
    const gateway = await chain.call<string>(M, MINTER_GATEWAY, [], "ethereum");
    let collateral = 0n;
    let owed = 0n;
    for (const minter of Object.values(MINTERS)) {
        const active = await chain.call<boolean>(gateway, IS_ACTIVE_MINTER, [minter], "ethereum");
        if (!active) continue;
        const [value, owedM] = await Promise.all([
            chain.call<bigint>(gateway, COLLATERAL_OF, [minter], "ethereum"),
            chain.call<bigint>(gateway, ACTIVE_OWED_M_OF, [minter], "ethereum"),
        ]);
        collateral += value;
        owed += owedM;
    }
    // M owed by a minter missing from the list would leave its collateral out. On 2026-11-04 the
    // listed minters owed all but about 840 of 217.6 million M, so only gaps over 0.1% are reported.
    const totalOwed = await chain.call<bigint>(gateway, TOTAL_ACTIVE_OWED_M, [], "ethereum");
    if ((totalOwed - owed) * 1000n > totalOwed)
        console.warn(
            `M: listed minters owe ${formatUnits(owed, 6)} M of ${formatUnits(totalOwed, 6)} M.`
        );
    return parseFloat(formatUnits(collateral, 6));
}

/** Collateral behind a number of M: the chain's share of the collateral of all minters. */
export async function mBacking(
    chain: ChainProxy,
    circulating: number
): Promise<bcked.asset.Backing> {
    const [collateral, { issued, burned }] = await Promise.all([
        mCollateral(chain),
        chain.getSupply(M, "ethereum"),
    ]);
    const total = issued - (burned ?? 0);
    return {
        timestamp: toISOString(Date.now()),
        underlying: {
            "rwa:undefined": total > 0 ? (collateral * circulating) / total : 0,
        },
    };
}
