// Temporary probe for issue #75 (FRAX price and Curve LP share). Removed before review.
import { Contract, JsonRpcProvider } from "ethers";

const ERC20 = [
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
];
const FEED = [
    "function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)",
    "function decimals() view returns (uint8)",
];
const ETH = `https://eth-mainnet.g.alchemy.com/v2/${process.env["ALCHEMY_ETHEREUM"]}`;
const AMO = "0xB1748C79709f4Ba2Dd82834B8c82D4a505003f27";

export default class Probe {
    async update(): Promise<void> {
        const p = new JsonRpcProvider(ETH, undefined, { batchMaxCount: 1 });
        console.log("block", await p.getBlockNumber());
        const feed = new Contract("0xB9E1E3A9feFf48998E45Fa90847ed4D467E8BcfD", FEED, p);
        const d = Number(await feed.getFunction("decimals")());
        const r = (await feed.getFunction("latestRoundData")()) as bigint[];
        console.log("feed", d, r[1]!.toString(), new Date(Number(r[3]) * 1000).toISOString());
        const lp = new Contract("0xBBaf8B2837CBbc7146F5bC978D6F84db0BE1CAcc", ERC20, p);
        console.log("lp totalSupply", (await lp.getFunction("totalSupply")()).toString());
        console.log("lp balance AMO", (await lp.getFunction("balanceOf")(AMO)).toString());
    }
}
