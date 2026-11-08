/**
 * Checks that FBTC_ASSETS (tokens/fbtc) still covers all FBTC and Locked FBTC, so the shares of
 * Chainlink's FBTC Proof of Reserves stay right. Exits non-zero if:
 * - a contract that burns FBTC (on Ethereum or BNB Chain) returns FBTC from fbtc() and is not in
 *   FBTC_ASSETS: a Locked FBTC token Ignition's docs do not list yet, or
 * - the tokens in FBTC_ASSETS and the reserves feed differ by more than 1%.
 *
 * Run weekly by the "Check Locked FBTC" workflow. Needs ALCHEMY_API_KEY (transfers API).
 * Usage: bun scripts/check_locked_fbtc.ts
 */
import { formatUnits, id } from "ethers";
import { readSupplies } from "../src/crawler/adapters/por_share";
import { ChainProxy } from "../src/crawler/chains/proxy";
import { FBTC_ASSETS, FBTC_POR } from "../tokens/fbtc";

const FBTC = "0xC96dE26018A54D51c097160568752c4E3BD6C364";
const ZERO = "0x0000000000000000000000000000000000000000";
// Senders that burned less than this are users redeeming, not Locked FBTC contracts.
const MIN_BURNED = 0.5;
const chain = new ChainProxy();

interface Transfers {
    transfers: { from: string; value: number | null }[];
    pageKey?: string;
}

// Alchemy endpoints for the transfers API (the crawler reads BNB Chain through its public RPC).
const ALCHEMY: Record<"ethereum" | "bsc", string> = {
    ethereum: "https://eth-mainnet.g.alchemy.com/v2/",
    bsc: "https://bnb-mainnet.g.alchemy.com/v2/",
};

/** FBTC burned per sender on a chain, from Alchemy's transfers API. */
async function burners(system: "ethereum" | "bsc"): Promise<Map<string, number>> {
    const burned = new Map<string, number>();
    let pageKey: string | undefined;
    do {
        const response = await fetch(`${ALCHEMY[system]}${process.env["ALCHEMY_API_KEY"]!}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "alchemy_getAssetTransfers",
                params: [
                    {
                        contractAddresses: [FBTC],
                        category: ["erc20"],
                        toAddress: ZERO,
                        maxCount: "0x3e8",
                        ...(pageKey ? { pageKey } : {}),
                    },
                ],
            }),
        });
        const page = ((await response.json()) as { result: Transfers }).result;
        for (const { from, value } of page.transfers)
            burned.set(from.toLowerCase(), (burned.get(from.toLowerCase()) ?? 0) + (value ?? 0));
        pageKey = page.pageKey;
    } while (pageKey);
    return burned;
}

// One plain eth_call, without the shared retry: most senders are wallets or other contracts, for
// which the call fails, and retrying each would take minutes.
async function readAddress(
    target: string,
    signature: string,
    system: bcked.system.Id
): Promise<string | null> {
    const code = await chain.send<string>("eth_getCode", [target, "latest"], system);
    if (code == "0x") return null;
    const data = id(signature).slice(0, 10);
    const result = await chain
        .send<string>("eth_call", [{ to: target, data }, "latest"], system)
        .catch(() => null);
    return result?.length == 66 ? `0x${result.slice(26)}` : null;
}

const known = new Set(FBTC_ASSETS.map((id) => id.toLowerCase()));
const problems: string[] = [];

for (const system of ["ethereum", "bsc"] as const) {
    for (const [sender, amount] of await burners(system)) {
        if (amount < MIN_BURNED || known.has(`${system}:${sender}`)) continue;
        const fbtc = await readAddress(sender, "fbtc()", system);
        if (fbtc?.toLowerCase() != FBTC.toLowerCase()) continue;
        const symbol = await chain
            .call<string>(sender, "function symbol() view returns (string)", [], system)
            .catch(() => "?");
        problems.push(`Locked FBTC not in FBTC_ASSETS: ${system}:${sender} (${symbol})`);
    }
}

const supplies = await readSupplies(FBTC_ASSETS);
const tokens = supplies.reduce((a, b) => a + b, 0);
const [, answer] = await chain.call<bigint[]>(
    FBTC_POR.address,
    "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
    [],
    FBTC_POR.system
);
const decimals = await chain.call<bigint>(
    FBTC_POR.address,
    "function decimals() view returns (uint8)",
    [],
    FBTC_POR.system
);
const reserves = parseFloat(formatUnits(answer!, Number(decimals)));
const gap = Math.abs(reserves - tokens) / reserves;
console.log(
    `FBTC and Locked FBTC: ${tokens.toFixed(2)}, reserves feed: ${reserves.toFixed(2)} BTC (${(gap * 100).toFixed(2)}% apart)`
);
if (gap > 0.01) problems.push(`Tokens and reserves differ by ${(gap * 100).toFixed(2)}%`);

for (const problem of problems) console.error(problem);
process.exit(problems.length ? 1 : 0);
