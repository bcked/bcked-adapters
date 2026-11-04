// Temporary probe for issue #79 (USX holders per chain). Removed before review.
import { Contract, JsonRpcProvider } from "ethers";

const k = process.env;
const CHAINS: Record<string, { url: string; usx: string }> = {
    ethereum: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${k["ALCHEMY_ETHEREUM"]}`,
        usx: "0x0a5E677a6A24b2F1A2Bf4F3bFfC443231d2fDEc8",
    },
    arbitrum: {
        url: `https://arb-mainnet.g.alchemy.com/v2/${k["ALCHEMY_ARBITRUM"]}`,
        usx: "0x641441c631e2F909700d2f41FD87F0aA6A6b4EDb",
    },
    optimism: {
        url: `https://opt-mainnet.g.alchemy.com/v2/${k["ALCHEMY_ETHEREUM"]}`,
        usx: "0xbfD291DA8A403DAAF7e5E9DC1ec0aCEaCd4848B9",
    },
};
const ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
];
const META = ["function symbol() view returns (string)", "function name() view returns (string)"];

async function transfers(url: string, usx: string, filter: Record<string, string>) {
    const out: { to: string; from: string; value: number }[] = [];
    let pageKey: string | undefined;
    for (let i = 0; i < 20; i++) {
        const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                id: 1,
                jsonrpc: "2.0",
                method: "alchemy_getAssetTransfers",
                params: [
                    {
                        fromBlock: "0x0",
                        toBlock: "latest",
                        contractAddresses: [usx],
                        category: ["erc20"],
                        withMetadata: false,
                        excludeZeroValue: true,
                        maxCount: "0x3e8",
                        ...filter,
                        ...(pageKey ? { pageKey } : {}),
                    },
                ],
            }),
        });
        const j = (await res.json()) as {
            result?: { transfers: { to: string; from: string; value: number }[]; pageKey?: string };
            error?: unknown;
        };
        if (!j.result) {
            console.log("transfers error", JSON.stringify(j.error));
            break;
        }
        out.push(...j.result.transfers);
        pageKey = j.result.pageKey;
        if (!pageKey) break;
    }
    return out;
}

export default class Probe {
    async update(): Promise<void> {
        for (const [name, c] of Object.entries(CHAINS)) {
            try {
                const p = new JsonRpcProvider(c.url, undefined, { batchMaxCount: 1 });
                const usx = new Contract(c.usx, ABI, p);
                const ts = Number(await usx.getFunction("totalSupply")()) / 1e18;
                const zero = "0x0000000000000000000000000000000000000000";
                const mints = await transfers(c.url, c.usx, { fromAddress: zero });
                const burns = await transfers(c.url, c.usx, { toAddress: zero });
                const addrs = new Set<string>();
                const mintBy: Record<string, number> = {};
                for (const t of mints) {
                    addrs.add(t.to);
                    mintBy[t.to] = (mintBy[t.to] ?? 0) + t.value;
                }
                const burnBy: Record<string, number> = {};
                for (const t of burns) burnBy[t.from] = (burnBy[t.from] ?? 0) + t.value;
                console.log(name, "totalSupply", ts.toFixed(0), "mints", mints.length, "burns", burns.length);
                const topMint = Object.entries(mintBy).sort((a, b) => b[1] - a[1]).slice(0, 12);
                for (const [a, v] of topMint) console.log(name, "minted to", a, v.toFixed(0), "burned from", (burnBy[a] ?? 0).toFixed(0));
                // Counterparties of the top mint recipients' outgoing transfers.
                for (const [a] of topMint.slice(0, 6)) {
                    const outs = await transfers(c.url, c.usx, { fromAddress: a });
                    const by: Record<string, number> = {};
                    for (const t of outs) by[t.to] = (by[t.to] ?? 0) + t.value;
                    for (const [b, v] of Object.entries(by).sort((x, y) => y[1] - x[1]).slice(0, 6)) {
                        addrs.add(b);
                        console.log(name, "  from", a, "to", b, v.toFixed(0));
                    }
                }
                const bals: [string, number][] = [];
                for (const a of addrs) bals.push([a, Number(await usx.getFunction("balanceOf")(a)) / 1e18]);
                bals.sort((x, y) => y[1] - x[1]);
                for (const [a, b] of bals.slice(0, 15)) {
                    let label = "";
                    try {
                        label = String(await new Contract(a, META, p).getFunction("symbol")());
                    } catch {
                        label = (await p.getCode(a)) === "0x" ? "EOA" : "contract";
                    }
                    console.log(name, "holder", a, b.toFixed(0), label);
                }
            } catch (e) {
                console.log(name, "ERROR", e instanceof Error ? e.message.slice(0, 300) : e);
            }
        }
    }
}
