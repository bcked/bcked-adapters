// Temporary probe, removed before the pull request.
import { formatUnits } from "ethers";
import { ChainProxy } from "../../src/crawler/chains/proxy";

const c = new ChainProxy();
const CRVUSD = "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E";
const FACTORY = "0xC9332fdCB1C491Dcc683bAe86Fe3cb70360738BC";
const REG = "0x36a04CAffc681fa179558B2Aaba30395CDdd855f";
const U = (x: bigint, d = 18) => formatUnits(x, d);
async function call<T>(a: string, s: string, args: unknown[] = [], sys = "ethereum"): Promise<T | string> {
    try {
        return await c.call<T>(a, s, args, sys);
    } catch (e) {
        return "ERR " + (e instanceof Error ? e.message.slice(0, 80) : "");
    }
}
const bal = async (t: string, h: string, sys = "ethereum") =>
    call<bigint>(t, "function balanceOf(address) view returns (uint256)", [h], sys);

export default class Probe {
    async getDetails() {
        const out: unknown[] = [];
        const log = (...a: unknown[]) => out.push(a.map((x) => (typeof x == "bigint" ? x.toString() : x)).join(" "));
        log("totalSupply", await call(CRVUSD, "function totalSupply() view returns (uint256)"));
        log("factory.stablecoin", await call(FACTORY, "function stablecoin() view returns (address)"));
        log("factory.total_debt", await call(FACTORY, "function total_debt() view returns (uint256)"));
        log("factory bal", await bal(CRVUSD, FACTORY));
        log("flashlender bal", await bal(CRVUSD, "0x26dE7861e213A5351F6ED767d00e0839930e9eE1"));
        log("flashlender ceiling", await call(FACTORY, "function debt_ceiling(address) view returns (uint256)", ["0x26dE7861e213A5351F6ED767d00e0839930e9eE1"]));
        const n = Number(await call<bigint>(FACTORY, "function n_collaterals() view returns (uint256)"));
        log("n_collaterals", n);
        for (let i = 0; i < n; i++) {
            const ctrl = (await call<string>(FACTORY, "function controllers(uint256) view returns (address)", [i])) as string;
            const amm = (await call<string>(FACTORY, "function amms(uint256) view returns (address)", [i])) as string;
            const col = (await call<string>(FACTORY, "function collaterals(uint256) view returns (address)", [i])) as string;
            const sym = await call(col, "function symbol() view returns (string)");
            const dec = Number(await call<bigint>(col, "function decimals() view returns (uint8)"));
            const ammCol = (await bal(col, amm)) as bigint;
            log(
                i, ctrl, amm, col, sym, dec,
                "ammCol", typeof ammCol == "bigint" ? U(ammCol, dec) : ammCol,
                "ammCrv", await bal(CRVUSD, amm),
                "ctrlCrv", await bal(CRVUSD, ctrl),
                "debt", await call(ctrl, "function total_debt() view returns (uint256)"),
                "ceiling", await call(FACTORY, "function debt_ceiling(address) view returns (uint256)", [ctrl]),
                "oracle", await call(amm, "function price_oracle() view returns (uint256)"),
                "ammcollToken", await call(amm, "function coins(uint256) view returns (address)", [1])
            );
        }
        for (let i = 0; i < 10; i++) {
            const r = await call<unknown[]>(REG, "function peg_keepers(uint256) view returns (address,address,bool,bool)", [i]);
            if (typeof r == "string") { log("reg", i, r); break; }
            const pk = r[0] as string, pool = r[1] as string;
            const coins = [];
            for (let j = 0; j < 2; j++) {
                const coin = await call<string>(pool, "function coins(uint256) view returns (address)", [j]);
                coins.push(coin, await call(coin as string, "function symbol() view returns (string)"), await call(coin as string, "function decimals() view returns (uint8)"), await call(pool, "function balances(uint256) view returns (uint256)", [j]));
            }
            log("pk", i, pk, pool, "debt", await call(pk, "function debt() view returns (uint256)"), "pkCrv", await bal(CRVUSD, pk),
                "ceiling", await call(FACTORY, "function debt_ceiling(address) view returns (uint256)", [pk]),
                "pkLP", await bal(pool, pk), "lpSupply", await call(pool, "function totalSupply() view returns (uint256)"), coins.join(" "));
        }
        for (const pk of ["0x9201da0D97CaAAff53f01B2fB56767C7072dE340","0xFb726F57d251aB5C731E5C64eD4F5F94351eF9F3","0x3fA20eAa107DE08B38a8734063D605d5842fe09C","0x338Cb2D827112d989A861cDe87CD9FfD913A1f9D"])
            log("docpk", pk, await call(pk, "function debt() view returns (uint256)"), await bal(CRVUSD, pk));
        // bridges on Ethereum named in Curve docs
        for (const [name, a] of Object.entries({ avax: "0x26D01ce989037befd7Ff63837A86e2da32E7D7e2", ftm: "0x0A92Fd5271dB1C41564BD01ef6b1a75fC1db4d4f", bnb: "0x76EAfda658C54548B460B3f190386699DE3827d8", kava: "0x1C4e4553F95C28bc529233Cc35D550befE7B83Fc", sonic: "0xf6F07B393e4cEE82EFBcD502Db2903f28aA0472e", polyX: "0x4782965BB280A8A6CA7dAEB31BEb25E181F66994", arbGw: "0xa3A7B6F88361F48403514059F1F16C8E78d60EeC", opBridge: "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1", baseBridge: "0x3154Cf16ccdb4C6d922629664174b904d80F2C35", polyPred: "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf" }))
            log("ethbal", name, a, await bal(CRVUSD, a));
        // L2 tokens
        const L2: Record<string, string> = { arbitrum: "0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5", base: "0x417Ac0e078398C154EdFadD9Ef675d30Be60Af93", bsc: "0xe2fb3F127f5450DeE44afe054385d74C392BdeF4", polygon: "0xc4Ce1D6F5D98D65eE25Cf85e9F2E9DcFEe6Cb5d6" };
        for (const [sys, t] of Object.entries(L2)) {
            log("l2", sys, t, await call(t, "function totalSupply() view returns (uint256)", [], sys), await call(t, "function symbol() view returns (string)", [], sys), await call(t, "function decimals() view returns (uint8)", [], sys));
            for (const s of ["l1Address", "l2Gateway", "REMOTE_TOKEN", "BRIDGE", "l1Token", "l2Bridge", "minter", "owner", "childChainManagerProxy", "rootToken", "admin"])
                log("  ", s, await call(t, `function ${s}() view returns (address)`, [], sys));
        }
        const gw = await call<string>(L2["arbitrum"]!, "function l2Gateway() view returns (address)", [], "arbitrum");
        if (typeof gw == "string" && gw.startsWith("0x")) log("arb counterpart", await call(gw, "function counterpartGateway() view returns (address)", [], "arbitrum"));
        log("base OTHER_BRIDGE", await call("0x4200000000000000000000000000000000000010", "function OTHER_BRIDGE() view returns (address)", [], "base"));
        log("bsc minter bal/supply via docs minter 0xc417", await call("0xc417E91098402Dd4F677782a2eC204C429CE513A", "function owner() view returns (address)", [], "bsc"));
        log("poly x-dao bridge owner", await call("0x4782965BB280A8A6CA7dAEB31BEb25E181F66994", "function owner() view returns (address)", [], "polygon"));
        console.log(out.join("\n"));
        return {};
    }
}
