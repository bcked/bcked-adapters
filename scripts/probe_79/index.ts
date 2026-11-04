// Temporary probe for issue #79 (USX supply per chain). Removed before review.
import { Contract, JsonRpcProvider } from "ethers";

const ERC20 = [
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
];
const MSDC = ["function getMSDMinters(address) view returns (address[])"];
const ANY = [
    "function totalMint() view returns (uint256)",
    "function totalBorrows() view returns (uint256)",
    "function getCash() view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function iToken() view returns (address)",
    "function l1ArbiUSXGateway() view returns (address)",
    "function l1OptiUSXGateway() view returns (address)",
    "function cBridge() view returns (address)",
    "function L2Bridge() view returns (address)",
    "function vault() view returns (address)",
    "function getProviders() view returns (address[])",
    "function controller() view returns (address)",
    "function owner() view returns (address)",
];
const GETTERS = ["iToken", "l1ArbiUSXGateway", "l1OptiUSXGateway", "cBridge", "L2Bridge", "vault", "getProviders", "controller", "owner"];

const k = process.env;
const CHAINS: Record<string, { url: string; usx: string; msdc?: string; extra?: string[] }> = {
    ethereum: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${k["ALCHEMY_ETHEREUM"]}`,
        usx: "0x0a5E677a6A24b2F1A2Bf4F3bFfC443231d2fDEc8",
        msdc: "0x45677a101D70E9910C418D9426bC6c5874CE2Fd7",
        extra: [
            "0x1AdC34Af68e970a93062b67344269fD341979eb0",
            "0xd1254d280e7504836e1B0E36535eBFf248483cEE",
            "0xF54954BA7e3cdFDA23941753b48039aB5192AEa0",
            "0x5268b3c4afb0860D365a093C184985FCFcb65234",
            "0x0c92617dF0753Af1CaB2d9Cc6A56173970d81740",
            "0x3e5De9F2BA58bA036E84d93c81e8DFb0f002DAF6",
        ],
    },
    arbitrum: {
        url: `https://arb-mainnet.g.alchemy.com/v2/${k["ALCHEMY_ARBITRUM"]}`,
        usx: "0x641441c631e2F909700d2f41FD87F0aA6A6b4EDb",
        extra: ["0x1D2eB423bC723DA7f927CA21B56A4C22aF6C72B4", "0x1De84422D17D7296F656B5307A9736044fEb71FA"],
    },
    polygon: {
        url: `https://polygon-mainnet.g.alchemy.com/v2/${k["ALCHEMY_POLYGON"]}`,
        usx: "0xCf66EB3D546F0415b368d98A95EAF56DeD7aA752",
        extra: ["0xc617076c27c418a3A2C593009A607A68aD178E78"],
    },
    optimism_eth_key: {
        url: `https://opt-mainnet.g.alchemy.com/v2/${k["ALCHEMY_ETHEREUM"]}`,
        usx: "0xbfD291DA8A403DAAF7e5E9DC1ec0aCEaCd4848B9",
        extra: ["0x70a35414FaD53752C9352401BE211779EC413BD4", "0x5385bCC7420012BaBd14675A466e24FBE2f9b1D6"],
    },
};

async function tryCall(c: Contract, fn: string, ...args: unknown[]): Promise<string> {
    try {
        const v = await c.getFunction(fn)(...args);
        return typeof v === "bigint" ? (Number(v) / 1e18).toFixed(2) : String(v);
    } catch {
        return "-";
    }
}

export default class Probe {
    async update(): Promise<void> {
        for (const [name, c] of Object.entries(CHAINS)) {
            try {
                const p = new JsonRpcProvider(c.url, undefined, { batchMaxCount: 1 });
                const usx = new Contract(c.usx, ERC20, p);
                console.log(name, "totalSupply", await tryCall(usx, "totalSupply"));
                const addrs = [...(c.extra ?? [])];
                if (c.msdc) {
                    const m = new Contract(c.msdc, MSDC, p);
                    const minters = (await m.getFunction("getMSDMinters")(c.usx)) as string[];
                    console.log(name, "minters", minters.join(","));
                    addrs.push(...minters);
                }
                const seen = new Set<string>();
                while (addrs.length) {
                    const a = addrs.shift()!;
                    if (seen.has(a.toLowerCase())) continue;
                    seen.add(a.toLowerCase());
                    const g = new Contract(a, ANY, p);
                    for (const fn of GETTERS) {
                        const v = await tryCall(g, fn);
                        if (v !== "-") {
                            console.log(name, a, fn, v);
                            for (const x of v.split(",")) if (/^0x[0-9a-fA-F]{40}$/.test(x) && seen.size < 40) addrs.push(x);
                        }
                    }
                    const x = new Contract(a, ANY, p);
                    console.log(
                        name,
                        a,
                        await tryCall(x, "symbol"),
                        "usxBal",
                        await tryCall(usx, "balanceOf", a),
                        "totalMint",
                        await tryCall(x, "totalMint"),
                        "totalBorrows",
                        await tryCall(x, "totalBorrows"),
                        "cash",
                        await tryCall(x, "getCash")
                    );
                }
            } catch (e) {
                console.log(name, "ERROR", e instanceof Error ? e.message.slice(0, 200) : e);
            }
        }
    }
}
