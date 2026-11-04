// Temporary probe for issue 61, removed before the pull request.
import { formatUnits, id as keccakId, zeroPadValue } from "ethers";
import { ChainProxy } from "../src/crawler/chains/proxy";
import { JsonApi } from "../src/utils/requests";

const TBTC = "0x18084fbA666a33d37592fA2633fD49a74DD93a88";
const BRIDGE = "0x5e4861a80B55f035D899f66772117F00FA0E8e7B";
const VAULT = "0x9C070027cdC9dc8F82416B2e5314E11DFb4FE3CD";
const L1DEP_ARB = "0x75A6e4A7C8fAa162192FAD6C1F7A6d48992c619A";

const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
function polymod(values: number[]) {
    const G = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    let chk = 1;
    for (const v of values) {
        const b = chk >> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ v;
        for (let i = 0; i < 5; i++) if ((b >> i) & 1) chk ^= G[i]!;
    }
    return chk;
}
function p2wpkh(hash: string) {
    const bytes = Buffer.from(hash.slice(2), "hex");
    const data = [0];
    let acc = 0, bits = 0;
    for (const b of bytes) { acc = (acc << 8) | b; bits += 8; while (bits >= 5) { bits -= 5; data.push((acc >> bits) & 31); } }
    if (bits) data.push((acc << (5 - bits)) & 31);
    const hrp = "bc";
    const exp = [...[...hrp].map((c) => c.charCodeAt(0) >> 5), 0, ...[...hrp].map((c) => c.charCodeAt(0) & 31)];
    const mod = polymod([...exp, ...data, 0, 0, 0, 0, 0, 0]) ^ 1;
    const checksum = [0, 1, 2, 3, 4, 5].map((i) => (mod >> (5 * (5 - i))) & 31);
    return hrp + "1" + [...data, ...checksum].map((d) => CHARSET[d]).join("");
}

export default class Probe {
    async getBacking() {
        const chain = new ChainProxy();
        const out: Record<string, unknown> = {};
        const sup = await chain.call<bigint>(TBTC, "function totalSupply() view returns (uint256)", [], "ethereum");
        out.supply = formatUnits(sup, 18);
        const bank = await chain.call<string>(VAULT, "function bank() view returns (address)", [], "ethereum");
        out.bank = bank;
        out.vaultBank = formatUnits(await chain.call<bigint>(bank, "function balanceOf(address) view returns (uint256)", [VAULT], "ethereum"), 8);
        out.optimisticDebt = "n/a";
        try {
            out.wormhole = await chain.call<string>(L1DEP_ARB, "function wormholeTokenBridge() view returns (address)", [], "ethereum");
        } catch (e) { out.wormhole = String(e); }
        const holders: Record<string, string> = {
            starkgate: "0x2111A49ebb717959059693a3698872a0aE9866b9",
            ccipPool: "0x03E342731c08FDDc34cFb43E91cB3a7e424ee0F6",
            l1depArb: L1DEP_ARB,
            l1depBase: "0x186D048097c7406C64EfB0537886E3CaE100a1fe",
            l1depSui: "0xb810AbD43d8FCFD812d6FEB14fefc236E92a341A",
            starkDep: "0xC9031f76006da0BD4bFa9E02aDf0d448dB3BC155",
            vault: VAULT,
            vm3: "0x7570a2350183b4BdF7CA74faD3Fc19048E6437e6",
        };
        if (typeof out.wormhole == "string" && out.wormhole.startsWith("0x")) holders.wormhole = out.wormhole;
        for (const [k, a] of Object.entries(holders)) out[`bal_${k}`] = (await chain.getBalance(a, TBTC, "ethereum")).balance;
        for (const [sys, a] of [["arbitrum", "0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40"], ["base", "0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b"], ["polygon", "0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b"], ["solana", "6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU"]] as const) {
            try { out[`supply_${sys}`] = await chain.getSupply(a, sys); } catch (e) { out[`supply_${sys}`] = String(e); }
            if (sys != "solana") try {
                out[`name_${sys}`] = await chain.call<string>(a, "function symbol() view returns (string)", [], sys);
                out[`gw_${sys}`] = (await chain.getBalance(sys == "arbitrum" ? "0x1293a54e160D1cd7075487898d65266081A15458" : "0x09959798B95d00a3183d20FaC298E4594E599eab", a, sys)).balance;
            } catch (e) { out[`name_${sys}`] = String(e); }
        }
        const feed = await chain.call<unknown[]>("0x8350b7De6a6a2C1368E7D4Bd968190e13E354297", "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)", [], "ethereum");
        out.feed = feed.map(String);
        out.feedDesc = await chain.call<string>("0x8350b7De6a6a2C1368E7D4Bd968190e13E354297", "function description() view returns (string)", [], "ethereum");

        const topic = keccakId("NewWalletRegistered(bytes32,bytes20)");
        out.topic = topic;
        const latest = Number(await chain.send<string>("eth_blockNumber", [], "ethereum"));
        const logs: { topics: string[]; data: string; blockNumber: string }[] = [];
        const ranges: string[] = [];
        async function get(from: number, to: number): Promise<void> {
            try {
                const r = await chain.send<typeof logs>("eth_getLogs", [{ address: BRIDGE, topics: [topic], fromBlock: "0x" + from.toString(16), toBlock: "0x" + to.toString(16) }], "ethereum");
                logs.push(...r); ranges.push(`${from}-${to}:${r.length}`);
            } catch (e) {
                ranges.push(`${from}-${to}:ERR ${String(e).slice(0, 200)}`);
                if (to - from < 1000) return;
                const mid = Math.floor((from + to) / 2);
                await get(from, mid); await get(mid + 1, to);
            }
        }
        await get(16_400_000, latest);
        out.ranges = ranges.slice(0, 30);
        out.logCount = logs.length;
        out.firstLog = logs[0];
        const mempool = new JsonApi("https://mempool.space/api");
        const wallets: unknown[] = [];
        let total = 0;
        for (const log of logs) {
            const pkh = log.topics.length > 2 ? "0x" + log.topics[2]!.slice(2, 42) : "0x" + log.data.slice(66, 106);
            const w = await chain.call<unknown[]>(BRIDGE, "function wallets(bytes20) view returns ((bytes32 ecdsaWalletID, bytes32 mainUtxoHash, uint64 pendingRedemptionsValue, uint32 createdAt, uint32 movingFundsRequestedAt, uint32 closingStartedAt, uint32 pendingMovedFundsSweepRequestsCount, uint8 state, bytes32 movingFundsTargetWalletsCommitmentHash))", [pkh], "ethereum");
            const s = w as unknown as { state: bigint; mainUtxoHash: string; createdAt: bigint };
            const state = Number(s.state);
            let btc: number | null = null;
            if (state != 4) {
                const a = await mempool.fetchJson<{ chain_stats: { funded_txo_sum: number; spent_txo_sum: number }; mempool_stats: { funded_txo_sum: number; spent_txo_sum: number } }>(`/address/${p2wpkh(pkh)}`);
                btc = (a.chain_stats.funded_txo_sum - a.chain_stats.spent_txo_sum) / 1e8;
                total += btc;
            }
            wallets.push([pkh, p2wpkh(pkh), state, Number(s.createdAt), s.mainUtxoHash.slice(0, 10), btc, log.blockNumber]);
        }
        out.wallets = wallets;
        out.walletTotal = total;
        out.zeroPad = zeroPadValue("0x01", 2);
        return out;
    }
}
