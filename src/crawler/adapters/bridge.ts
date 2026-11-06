/**
 * Backing of stablecoins issued by Bridge (https://www.bridge.xyz/), from its public transparency API
 * (https://transparency.bridge.xyz/v0/stablecoins/<symbol>). The API states the reserves for all
 * chains together as cash and treasuries, and the total on-chain supply. A chain asset gets the share
 * of the reserves that matches its supply over that total, so chains bcked does not read are simply
 * left out. Treasuries include money market funds that hold Treasury bills, they are recorded as
 * Treasury bills.
 */
import { JsonApi } from "../../utils/requests";
import { toISOString } from "../../utils/string_formatting";

interface BridgeTransparency {
    last_updated: string;
    total_onchain_amount: string;
    total_reserve_amount: string;
    reserves: { type: string; amount: string }[];
}

const UNDERLYING: Record<string, bcked.asset.Id> = {
    cash: "rwa:USD",
    treasury: "rwa:USTB",
};

const bridge = new JsonApi("https://transparency.bridge.xyz");

/**
 * The chain's share of the reserves of a Bridge stablecoin, or nothing if it has no new report.
 *
 * @param symbol Lowercase symbol in the transparency API, e.g. "ousd"
 * @param chainSupply Supply of the token on the chain, read on-chain
 */
export async function bridgeBackingShare(
    symbol: string,
    chainSupply: number,
    lastRecorded: bcked.asset.Backing | null
): Promise<bcked.asset.Backing[]> {
    const report = await bridge.fetchJson<BridgeTransparency>(`/v0/stablecoins/${symbol}`);
    const timestamp = toISOString(new Date(report.last_updated));
    if (lastRecorded && lastRecorded.timestamp >= timestamp) return [];
    const total = Number(report.total_onchain_amount);
    if (!(total > 0) || !(chainSupply > 0)) return [];
    const share = Math.min(chainSupply / total, 1);
    const underlying: Partial<Record<bcked.asset.Id, number>> = {};
    for (const { type, amount } of report.reserves) {
        const id = UNDERLYING[type];
        if (!id) throw Error(`Unknown reserve type in Bridge's ${symbol} data: ${type}`);
        underlying[id] = (underlying[id] ?? 0) + Number(amount) * share;
    }
    return [{ timestamp, underlying }];
}
