/**
 * Wrapped YLDS (wYLDS) of the Hastra protocol (https://hastra.io/), operated by Signum Ltd. wYLDS
 * is minted 1:1 against USDC on Ethereum and on Solana, each chain with its own vault. The protocol
 * buys YLDS of Figure Certificate Company with the USDC and lends part of it in Figure's Prime
 * lending pools.
 *
 * The backing comes from the Hastra Pulse Public API (proof of reserves), which Hastra publishes
 * for partners, aggregators and dashboards:
 * https://hastra.io/hastra-pulse/public/api/v1/swagger/index.html
 * It states, for all chains together:
 * - the YLDS held by the protocol's account on the Provenance Blockchain, including YLDS in an open
 *   sell order,
 * - the YLDS deployed into Prime lending pools (PRIME, AUTO, SMB), now loan receivables,
 * - USDC held, in transit to Provenance or waiting to buy YLDS.
 * Each chain gets the share of the reserves that matches its wYLDS supply in the same snapshot.
 * Hastra's own backing ratio also counts the wYLDS waiting for redemption. These are still part of
 * the supply, so they are not counted as backing here.
 */
import { JsonApi } from "../../utils/requests";
import { toISOString } from "../../utils/string_formatting";

interface HastraPor {
    timestamp: string;
    wylds_card: {
        supply: string;
        supply_by_chain: Record<string, string>;
        usdc_in_transit: string;
        ylds_pending_purchase: string;
    };
    hastra_account_card: {
        ylds_balance: string;
        usdc_balance: string;
        ylds_pending_sale: string;
    };
    demo_prime_card: {
        ylds_balance: string;
    };
}

const pulse = new JsonApi("https://hastra.io/hastra-pulse");
let porCache: Promise<HastraPor> | null = null;

function porData(): Promise<HastraPor> {
    porCache ??= pulse.fetchJson<HastraPor>("/public/api/v1/por").catch((error: unknown) => {
        porCache = null;
        throw error;
    });
    return porCache;
}

/**
 * The backing of wYLDS on one chain, from Hastra's proof of reserves.
 *
 * YLDS is not tracked by bcked, so YLDS and the USDC on Provenance are recorded as rwa:UNTRACKED at
 * one US dollar per unit. YLDS lent into the Prime pools is recorded as rwa:LOAN.
 *
 * @param chain Hastra's chain key ("ethereum" or "solana")
 * @param lastRecorded Latest backing already recorded for the chain asset
 */
export async function wyldsBacking(
    chain: string,
    lastRecorded: bcked.asset.Backing | null
): Promise<bcked.asset.Backing[]> {
    const por = await porData();
    const timestamp = toISOString(new Date(por.timestamp));
    if (lastRecorded && lastRecorded.timestamp >= timestamp) return [];

    const total = Number(por.wylds_card.supply);
    const onChain = Number(por.wylds_card.supply_by_chain[chain]);
    if (!(total > 0) || !(onChain >= 0)) return [];
    const share = Math.min(onChain / total, 1);

    const held =
        Number(por.hastra_account_card.ylds_balance) +
        Number(por.hastra_account_card.ylds_pending_sale) +
        Number(por.hastra_account_card.usdc_balance) +
        Number(por.wylds_card.usdc_in_transit) +
        Number(por.wylds_card.ylds_pending_purchase);
    const lent = Number(por.demo_prime_card.ylds_balance);
    if (!Number.isFinite(held) || !Number.isFinite(lent))
        throw Error("Unexpected values in Hastra's proof of reserves");

    return [
        {
            timestamp,
            underlying: {
                "rwa:UNTRACKED": held * share,
                "rwa:LOAN": lent * share,
            },
        },
    ];
}
