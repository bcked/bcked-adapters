// Temporary probe, removed before the pull request.
import { id as topicId, getAddress } from "ethers";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const c = new ChainProxy();
const CRVUSD = "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E";
const FACTORY = "0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC";
async function call(a: string, s: string, args: unknown[] = []): Promise<string> {
    try {
        const r = await c.call<unknown>(a, s, args, "ethereum");
        return String(r);
    } catch {
        return "-";
    }
}
interface Log { topics: string[]; data: string; blockNumber: string; transactionHash: string }
export default class Probe {
    async getDetails() {
        const out: string[] = [];
        const logs = await c.send<Log[]>("eth_getLogs", [{ address: FACTORY, fromBlock: "0x1072000", toBlock: "latest" }], "ethereum");
        const names: Record<string, string> = {};
        for (const sig of ["SetDebtCeiling(address,uint256)", "AddMarket(address,address,address,address,uint256)", "MintForMarket(address,uint256)", "RemoveFromMarket(address,uint256)", "SetImplementations(address,address)", "SetAdmin(address)", "SetFeeReceiver(address)"]) names[topicId(sig)] = sig;
        const addrs = new Set<string>();
        for (const l of logs) {
            const n = names[l.topics[0]!] ?? l.topics[0]!;
            if (n.startsWith("SetDebtCeiling") || n.startsWith("MintForMarket") || n.startsWith("RemoveFromMarket")) {
                const a = getAddress("0x" + (l.topics[1] ?? l.data.slice(0, 66)).slice(26));
                addrs.add(a);
                out.push([parseInt(l.blockNumber, 16), n.split("(")[0], a, l.topics.length > 1 ? BigInt("0x" + l.data.slice(2, 66)).toString() : l.data].join(" "));
            } else out.push([parseInt(l.blockNumber, 16), n.slice(0, 20), l.topics.slice(1).join(","), l.data.slice(0, 140)].join(" "));
        }
        for (const a of addrs)
            out.push(["ADDR", a, "ceiling", await call(FACTORY, "function debt_ceiling(address) view returns (uint256)", [a]),
                "bal", await call(CRVUSD, "function balanceOf(address) view returns (uint256)", [a]),
                "total_debt", await call(a, "function total_debt() view returns (uint256)"),
                "debt", await call(a, "function debt() view returns (uint256)"),
                "name", await call(a, "function name() view returns (string)"),
                "symbol", await call(a, "function symbol() view returns (string)"),
                "pool", await call(a, "function pool() view returns (address)"),
                "owner", await call(a, "function owner() view returns (address)"),
                "admin", await call(a, "function admin() view returns (address)"),
                "factory", await call(a, "function factory() view returns (address)"),
                "code", (await c.send<string>("eth_getCode", [a, "latest"], "ethereum")).length].join(" "));
        console.log(out.join("\n"));
        return {};
    }
}
