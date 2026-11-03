"""Prices USDG at a report time from executed swaps in the Orca USDG/USDC pool on Solana.

Usage: SOLANA_RPC=<url> python3 orca_usdg_price.py <output.json> <YYYY-MM-DDTHH:MM:SS>...

Before 2025-08 USDG had no Ethereum pool with liquidity (Uniswap v4 moved $29k in total). On Solana
the Orca Whirlpool 9RqDTfwCx2SgxsvKpspQHc38HUo3B6hRd3oR9JR966Ps (USDG/USDC, 0.01% fee) traded from
2025-03. Solana RPCs keep no past account state, so the price is the median of up to 10 swaps of at
least 100 USDG within 6 hours of the time, from the pool's token balance changes in each transaction.
It is in USDC: convert it with the Chainlink USDC price before writing it to the records.
"""
import datetime
import json
import os
import statistics
import sys
import time
import urllib.request

# A Solana RPC with an API key (Alchemy in CI). The public endpoint is meant for development, and the
# Solana Foundation's terms forbid systematic data collection from its services.
RPC = os.environ.get("SOLANA_RPC") or sys.exit("Set SOLANA_RPC to a Solana RPC URL")
POOL = "9RqDTfwCx2SgxsvKpspQHc38HUo3B6hRd3oR9JR966Ps"
USDG = "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH"
USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
WINDOW = 6 * 3600
MIN_SWAP = 100


def rpc(method, params):
    # The public RPC fails now and then on old history ("long-term storage"), so retry for minutes.
    error = None
    for delay in (2, 5, 10, 20, 40, 60, 90, 120, 180, None):
        try:
            body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
            request = urllib.request.Request(RPC, body, {"Content-Type": "application/json"})
            result = json.load(urllib.request.urlopen(request, timeout=60))
            if "error" not in result:
                return result["result"]
            error = result["error"]
            if error.get("code") in (-32007, -32009):  # skipped slot: permanent
                raise LookupError(error)
        except LookupError:
            raise
        except Exception as e:
            error = e
        if delay is None:
            raise RuntimeError(f"{method}: {error}")
        time.sleep(delay)


def time_of(slot):
    """Time of the slot, or of the next one that was not skipped."""
    for offset in range(30):
        try:
            return rpc("getBlockTime", [slot + offset])
        except LookupError:
            continue


def slot_at(t):
    """First slot at or after time t."""
    hi = rpc("getSlot", [{"commitment": "finalized"}])
    lo = hi - int((rpc("getBlockTime", [hi]) - t) / 0.4)
    while time_of(lo) >= t:  # slots are about 0.4 s, but the estimate drifts by weeks over a year
        lo -= int((time_of(lo) - t) * 3) + 200_000
    while hi - lo > 50:
        mid = (lo + hi) // 2
        if time_of(mid) < t:
            lo = mid
        else:
            hi = mid
    return hi


def signatures_near(t):
    """Pool transactions within the window around t, closest first."""
    slot = slot_at(t + WINDOW)
    for candidate in range(slot, slot + 20):
        try:
            block = rpc("getBlock", [candidate, {"transactionDetails": "signatures", "rewards": False, "maxSupportedTransactionVersion": 0}])
            break
        except LookupError:
            continue
    # Paging starts at any transaction of that block: "before" only sets the point in time.
    before, found = block["signatures"][0], []
    while True:
        page = rpc("getSignaturesForAddress", [POOL, {"limit": 1000, "before": before}])
        if not page:
            break
        found += [
            (abs(s["blockTime"] - t), s["signature"])
            for s in page
            if not s.get("err") and s.get("blockTime") and abs(s["blockTime"] - t) <= WINDOW
        ]
        before = page[-1]["signature"]
        if page[-1]["blockTime"] < t - WINDOW:
            break
    return [signature for _, signature in sorted(found)]


def swap_price(signature):
    """USDC per USDG of a swap through the pool, or None for other transactions."""
    tx = rpc("getTransaction", [signature, {"encoding": "jsonParsed", "maxSupportedTransactionVersion": 0}])
    if not tx or tx["meta"].get("err"):
        return None

    def pool_balance(balances, mint):
        return sum(float(b["uiTokenAmount"]["uiAmountString"]) for b in balances if b.get("owner") == POOL and b["mint"] == mint)

    pre, post = tx["meta"]["preTokenBalances"], tx["meta"]["postTokenBalances"]
    usdg = pool_balance(post, USDG) - pool_balance(pre, USDG)
    usdc = pool_balance(post, USDC) - pool_balance(pre, USDC)
    if usdg * usdc < 0 and abs(usdg) >= MIN_SWAP:
        return abs(usdc / usdg)
    return None


def main(output, times):
    results = json.load(open(output)) if os.path.exists(output) else {}
    for text in times:
        t = datetime.datetime.fromisoformat(text).replace(tzinfo=datetime.timezone.utc).timestamp()
        prices = []
        for signature in signatures_near(t)[:200]:
            price = swap_price(signature)
            if price is not None:
                prices.append(price)
            if len(prices) >= 10:
                break
        median = statistics.median(prices) if prices else None
        results[text] = {"median": median, "swaps": prices}
        print(f"{text}: {len(prices)} swaps, median {median}", file=sys.stderr)
        with open(output, "w") as f:
            json.dump(results, f, indent=1)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2:])
