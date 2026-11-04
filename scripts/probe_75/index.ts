// Temporary probe for issue #75 (FRAX supply per chain). Removed before review.
import { Contract, JsonRpcProvider } from "ethers";

const ERC20 = [
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalAssets() view returns (uint256)",
    "function convertToAssets(uint256) view returns (uint256)",
];
const COMET = ["function userCollateral(address,address) view returns (uint128,uint128)"];
const FEED = [
    "function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)",
    "function decimals() view returns (uint8)",
    "function description() view returns (string)",
];
const CURVE = [
    "function balances(uint256) view returns (uint256)",
    "function coins(uint256) view returns (address)",
];

const k = process.env;
const ETH = `https://eth-mainnet.g.alchemy.com/v2/${k["ALCHEMY_ETHEREUM"]}`;
const CHAINS: Record<string, { url: string; token: string; holders: string[] }> = {
    ethereum: {
        url: ETH,
        token: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
        holders: [
            "0x34C0bD5877A5Ee7099D0f5688D65F4bB9158BDE2",
            "0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32",
            "0xB1748C79709f4Ba2Dd82834B8c82D4a505003f27",
            "0xA381d58e96eC3818c825E1fb264099448945CF8b",
            "0x85c5f05Ae4CB68190C695a22b292C3bA90696128",
            "0x06Fa869caa1160754C6a0B744Da6454c5EA325d4",
            "0x43959A388603DCb6B02Ca084A55d4c7f3b442c57",
            "0xc030b717b96B83bf4EC4a075dD547614953968FD",
            "0xBBaf8B2837CBbc7146F5bC978D6F84db0BE1CAcc",
        ],
    },
    arbitrum: {
        url: `https://arb-mainnet.g.alchemy.com/v2/${k["ALCHEMY_ARBITRUM"]}`,
        token: "0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F",
        holders: ["0x5a9BEf8CEa603aAc78a523fb245C1A9264D50706"],
    },
    optimism: {
        url: `https://opt-mainnet.g.alchemy.com/v2/${k["ALCHEMY_ETHEREUM"]}`,
        token: "0x2E3D870790dC77A83DD1d18184Acc7439A53f475",
        holders: ["0xb781FCaC4B8eF06891F9baD7dB9C178B1cE67967"],
    },
    polygon: {
        url: `https://polygon-mainnet.g.alchemy.com/v2/${k["ALCHEMY_POLYGON"]}`,
        token: "0x45c32fA6DF82ead1e2EF74d17b76547EDdFaFF89",
        holders: ["0x6f7F18C15B97dC9Fac48Ae7F986989F97D25dbc7"],
    },
    fraxtal: {
        url: `https://frax-mainnet.g.alchemy.com/v2/${k["ALCHEMY_ETHEREUM"]}`,
        token: "0xff000000000000000000000000000000000001Fd",
        holders: [
            "0xC4EB45d80DC1F079045E75D5d55de8eD1c1090E6",
            "0x6c9f4E6089c8890AfEE2bcBA364C2712f88fA818",
            "0xacA9A33698cF96413A40A4eB9E87906ff40fC6CA",
        ],
    },
};

const n = (v: bigint, d = 18) => (Number(v) / 10 ** d).toFixed(2);

async function tryRun(label: string, f: () => Promise<unknown>) {
    try {
        console.log(label, await f());
    } catch (e) {
        console.log(label, "ERROR", e instanceof Error ? e.message.slice(0, 200) : e);
    }
}

export default class Probe {
    async update(): Promise<void> {
        for (const [name, c] of Object.entries(CHAINS)) {
            try {
                const p = new JsonRpcProvider(c.url, undefined, { batchMaxCount: 1 });
                const t = new Contract(c.token, ERC20, p);
                console.log(name, "block", await p.getBlockNumber());
                console.log(name, await t.getFunction("name")(), await t.getFunction("symbol")());
                console.log(name, "totalSupply", n(await t.getFunction("totalSupply")()));
                for (const h of c.holders) {
                    await tryRun(`${name} balance ${h}`, async () =>
                        n(await t.getFunction("balanceOf")(h))
                    );
                }
            } catch (e) {
                console.log(name, "ERROR", e instanceof Error ? e.message.slice(0, 200) : e);
            }
        }

        const p = new JsonRpcProvider(ETH, undefined, { batchMaxCount: 1 });
        const sfrax = new Contract("0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32", ERC20, p);
        await tryRun("sFRAX totalSupply", async () => n(await sfrax.getFunction("totalSupply")()));
        await tryRun("sFRAX totalAssets", async () => n(await sfrax.getFunction("totalAssets")()));
        await tryRun("sFRAX convertToAssets(1e18)", async () =>
            n(await sfrax.getFunction("convertToAssets")(10n ** 18n))
        );
        for (const h of [
            "0x34C0bD5877A5Ee7099D0f5688D65F4bB9158BDE2",
            "0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840",
            "0xB1748C79709f4Ba2Dd82834B8c82D4a505003f27",
        ]) {
            await tryRun(`sFRAX balance ${h}`, async () =>
                n(await sfrax.getFunction("balanceOf")(h))
            );
        }
        const comet = new Contract("0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840", COMET, p);
        await tryRun("comet userCollateral AMO sFRAX", async () =>
            (
                (await comet.getFunction("userCollateral")(
                    "0xB1748C79709f4Ba2Dd82834B8c82D4a505003f27",
                    "0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32"
                )) as bigint[]
            ).map((v) => n(v))
        );
        const feed = new Contract("0xB9E1E3A9feFf48998E45Fa90847ed4D467E8BcfD", FEED, p);
        await tryRun("feed", async () => {
            const d = Number(await feed.getFunction("decimals")());
            const r = (await feed.getFunction("latestRoundData")()) as bigint[];
            return [
                await feed.getFunction("description")(),
                n(r[1]!, d),
                new Date(Number(r[3]) * 1000).toISOString(),
            ];
        });
        for (const pool of [
            "0xc030b717b96B83bf4EC4a075dD547614953968FD",
            "0xBBaf8B2837CBbc7146F5bC978D6F84db0BE1CAcc",
        ]) {
            const c = new Contract(pool, CURVE, p);
            for (const i of [0, 1]) {
                await tryRun(`curve ${pool} coin ${i}`, async () => [
                    await c.getFunction("coins")(i),
                    n(await c.getFunction("balances")(i)),
                ]);
            }
        }
    }
}
