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
import { formatUnits, getAddress, id } from "ethers";

import { ChainProxy } from "../chains/proxy";
import { toISOString } from "../../utils/string_formatting";

export const M = "0x866A2BF4E572CbcF37D5071A7a58503Bfb36be1b";
// Holds the M bridged from Ethereum to other chains (lock and release).
export const M_HUB_PORTAL = "0xD925C84b55E4e44a53749fF5F2a5A13F63D128fd";

const MINTER_GATEWAY = "function minterGateway() view returns (address)";
const IS_ACTIVE_MINTER = "function isActiveMinter(address) view returns (bool)";
const COLLATERAL_OF = "function collateralOf(address) view returns (uint240)";
const MINTER_ACTIVATED = id("MinterActivated(address,address)");
// Before M was deployed (2024-01).
const FROM_BLOCK = 19_000_000;

interface Log {
    topics: string[];
}

/** Addresses of all minters ever activated on the MinterGateway. */
async function minters(chain: ChainProxy, gateway: string): Promise<string[]> {
    const logs = await chain.send<Log[]>(
        "eth_getLogs",
        [
            {
                address: gateway,
                fromBlock: `0x${FROM_BLOCK.toString(16)}`,
                toBlock: "latest",
                topics: [MINTER_ACTIVATED],
            },
        ],
        "ethereum"
    );
    return [...new Set(logs.map((log) => getAddress(`0x${log.topics[1]!.slice(-40)}`)))];
}

/** Collateral of all active minters in US dollars, read from the MinterGateway. */
export async function mCollateral(chain: ChainProxy): Promise<number> {
    const gateway = await chain.call<string>(M, MINTER_GATEWAY, [], "ethereum");
    let total = 0n;
    for (const minter of await minters(chain, gateway)) {
        const active = await chain.call<boolean>(gateway, IS_ACTIVE_MINTER, [minter], "ethereum");
        if (!active) continue;
        total += await chain.call<bigint>(gateway, COLLATERAL_OF, [minter], "ethereum");
    }
    return parseFloat(formatUnits(total, 6));
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
