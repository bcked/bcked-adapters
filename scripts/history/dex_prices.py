"""Adds on-chain DEX prices at report dates that have no Chainlink price.

Usage: ETHEREUM_RPC=<archive RPC> python3 dex_prices.py <records dir> [--dry-run] [<asset address>...]

Some assets have backing records before a Chainlink feed exists for them (PAXG, WBTC, USDC, USDG),
and BUSD never had one. Without a price these records have no backing ratio. For each backing
timestamp without a price within 12 hours, this reads the asset's price from Uniswap pools on
Ethereum at the block of that time: the v2 reserves or the v3 pool price. Of the pools listed per
asset, it takes the one with the most quote tokens, and only if they are worth at least $1M. The quote
token (WETH or USDC) is converted to USD with its Chainlink feed, read at the same block, so a price
exists only where that feed does. Chain variants of a token get the same
price. Existing price rows are kept.
"""
import bisect
import csv
import datetime
import json
import os
import sys
import time
import urllib.request

# An Ethereum archive RPC with an API key (Alchemy in CI). Keyless public endpoints are not used:
# their terms require an account.
RPC = os.environ.get("ETHEREUM_RPC") or sys.exit("Set ETHEREUM_RPC to an Ethereum archive RPC URL")
WINDOW = 12 * 3600
MIN_LIQUIDITY_USD = float(os.environ.get("MIN_LIQUIDITY_USD", 1_000_000))

WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
# Quote token: (decimals, Chainlink USD feed on Ethereum).
QUOTES = {
    WETH: (18, "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"),  # ETH / USD
    USDC: (6, "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6"),  # USDC / USD
}

# Asset address: (decimals, [(pool, version, quote token)], chain variants that share the price).
ASSETS = {
    "0x45804880De22913dAFE09f4980848ECE6EcbAf78": (  # PAXG
        18,
        [
            ("0x9C4Fe5FFD9A9fC5678cFBd93Aa2D4FD684b67C4C", 2, WETH),
            ("0x8a7e585048bdA875e64024118c506B14f78166dD", 3, WETH),
            ("0xb431c70f800100D87554ac1142c4A94C5Fe4C0C4", 3, USDC),
        ],
        [],
    ),
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": (  # WBTC
        8,
        [
            ("0xBb2b8038a1640196FbE3e38816F3e67Cba72D940", 2, WETH),
            ("0xCBCdF9626bC03E24f779434178A73a0B4bad62eD", 3, WETH),
            ("0x4585FE77225b41b697C938B018E2Ac67Ac5a20c0", 3, WETH),
            ("0x99ac8cA7087fA4A2A1FB6357269965A2014ABc35", 3, USDC),
        ],
        [],
    ),
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": (  # USDC
        6,
        [
            ("0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc", 2, WETH),
            ("0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8", 3, WETH),
            ("0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640", 3, WETH),
        ],
        [],
    ),
    "0x4Fabb145d64652a948d72533023f6E7A623C7C53": (  # BUSD
        18,
        [
            ("0xC2923b8a9683556A3640ccc2961B2F52B5c4459A", 2, WETH),
            ("0x524847C615639e76fE7D0fE0B16be8c4eAC9cf3c", 2, USDC),
            ("0x00cEf0386Ed94d738c8f8A74E8BFd0376926d24C", 3, USDC),
            ("0x5E35C4EBa72470EE1177DCB14dDdf4d9e6D915f4", 3, USDC),
        ],
        [],
    ),
    "0xe343167631d89B6Ffc58B88d6b7fB0228795491D": (  # USDG
        6,
        [
            ("0x817097fF6BFBf3E76097fc481E17be155CFD9Bd4", 3, USDC),
            ("0x6B03d3218c51B1c15A68D433C0a161F5A0Aa052E", 3, WETH),
        ],
        [
            "solana:2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH",
            "ink:0xe343167631d89B6Ffc58B88d6b7fB0228795491D",
            "xlayer:0x4ae46a509F6b1D9056937BA4500cb143933D2dc8",
            "robinhood:0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
        ],
    ),
}


def rpc(method, params):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    headers = {"Content-Type": "application/json", "User-Agent": "bcked"}
    for delay in (1, 3, 8, 20, None):
        try:
            result = json.load(urllib.request.urlopen(urllib.request.Request(RPC, body, headers), timeout=30))
            if "error" not in result:
                return result["result"]
            error = result["error"]
        except Exception as e:  # network errors and rate limits
            error = e
        if delay is None:
            raise RuntimeError(f"{method} failed: {error}")
        time.sleep(delay)


def call(to, data, block):
    return rpc("eth_call", [{"to": to, "data": data}, hex(block)])


def block_time(number):
    return int(rpc("eth_getBlockByNumber", [hex(number), False])["timestamp"], 16)


def block_at(t, latest):
    """Last block at or before time t: interpolation, with a bisection step every other round."""
    lo, hi = 1, latest
    t_lo, t_hi = block_time(lo), block_time(hi)
    step = 0
    while hi - lo > 1:
        if step % 2 == 0:
            guess = lo + int((t - t_lo) * (hi - lo) / max(1, t_hi - t_lo))
        else:
            guess = (lo + hi) // 2
        guess = min(max(guess, lo + 1), hi - 1)
        t_guess = block_time(guess)
        if t_guess <= t:
            lo, t_lo = guess, t_guess
        else:
            hi, t_hi = guess, t_guess
        step += 1
    return lo


def feed_usd(feed, block):
    """Chainlink answer at the block, or None before the feed existed."""
    try:
        data = call(feed, "0xfeaf968c", block)  # latestRoundData()
        if len(data) < 2 + 64 * 5:
            return None
        decimals = word(call(feed, "0x313ce567", block), 0)
    except RuntimeError:
        return None
    answer = word(data, 1)
    return answer / 10**decimals if answer else None


def word(data, i):
    return int(data[2 + 64 * i : 2 + 64 * (i + 1)], 16)


def pool_price(pool, version, asset, decimals, quote, block):
    """Price of the asset in quote tokens and the quote tokens in the pool, or None."""
    data = call(pool, "0x0dfe1681", block)
    if len(data) < 66:  # pool not deployed yet at this block
        return None
    token0 = "0x" + data[-40:]
    quote_decimals = QUOTES[quote][0]
    balance = word(call(quote, "0x70a08231" + pool[2:].lower().rjust(64, "0"), block), 0) / 10**quote_decimals
    asset_is_0 = token0.lower() == asset.lower()
    if version == 2:
        data = call(pool, "0x0902f1ac", block)
        r0, r1 = word(data, 0), word(data, 1)
        if not r0 or not r1:
            return None
        ra, rq = (r0, r1) if asset_is_0 else (r1, r0)
        price = (rq / 10**quote_decimals) / (ra / 10**decimals)
    else:
        sqrt = word(call(pool, "0x3850c7bd", block), 0)
        if not sqrt:
            return None
        raw = (sqrt / 2**96) ** 2  # token1 per token0 in base units
        d0, d1 = (decimals, quote_decimals) if asset_is_0 else (quote_decimals, decimals)
        p1_per_0 = raw * 10**d0 / 10**d1
        price = p1_per_0 if asset_is_0 else 1 / p1_per_0
    return price, balance


def read_prices(records, asset_id):
    path = os.path.join(records, "assets", asset_id, "records", "price.csv")
    if not os.path.exists(path):
        return {}
    with open(path) as f:
        return {row["timestamp"]: row["usd"] for row in csv.DictReader(f)}


def seconds(timestamp):
    return datetime.datetime.fromisoformat(timestamp.replace("Z", "+00:00")).timestamp()


def closest(series, t):
    """Value of a sorted [(seconds, value)] series closest to t within the window, or None."""
    i = bisect.bisect_left(series, (t,))
    best = None
    for j in (i - 1, i):
        if 0 <= j < len(series) and abs(series[j][0] - t) <= WINDOW:
            if best is None or abs(series[j][0] - t) < abs(best[0] - t):
                best = series[j]
    return float(best[1]) if best else None


def write_prices(records, asset_id, new):
    path = os.path.join(records, "assets", asset_id, "records", "price.csv")
    rows = read_prices(records, asset_id)
    added = {t: v for t, v in new.items() if t not in rows}
    rows.update(added)
    with open(path, "w") as f:
        f.write("timestamp,usd\n")
        for t in sorted(rows):
            f.write(f"{t},{rows[t]}\n")
    return len(added)


def main(records, dry_run, only):
    latest = int(rpc("eth_blockNumber", []), 16)
    for address, (decimals, pools, variants) in ASSETS.items():
        if only and address not in only:
            continue
        asset_id = f"ethereum:{address}"
        prices = sorted((seconds(t), v) for t, v in read_prices(records, asset_id).items())
        times = set()
        for chain_asset in [asset_id, *variants]:
            path = os.path.join(records, "assets", chain_asset, "records", "backing.csv")
            if os.path.exists(path):
                with open(path) as f:
                    times.update(row["timestamp"] for row in csv.DictReader(f))
        missing = sorted(t for t in times if closest(prices, seconds(t)) is None)
        new = {}
        for timestamp in missing:
            t = seconds(timestamp)
            block = block_at(int(t), latest)
            quote_usd = {q: feed_usd(QUOTES[q][1], block) for q in {quote for _, _, quote in pools}}
            best = None
            for pool, version, quote in pools:
                if quote_usd[quote] is None:
                    continue
                result = pool_price(pool, version, address, decimals, quote, block)
                if result is None:
                    continue
                price, balance = result
                liquidity = balance * quote_usd[quote]
                if liquidity >= MIN_LIQUIDITY_USD and (best is None or liquidity > best[1]):
                    best = (price * quote_usd[quote], liquidity, pool)
            if best is None:
                print(f"{asset_id} {timestamp}: no pool with enough liquidity", file=sys.stderr)
                continue
            stamp = datetime.datetime.fromtimestamp(block_time(block), datetime.timezone.utc)
            key = stamp.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            new[key] = round(best[0], 8)
            print(f"{asset_id} {timestamp}: {best[0]:.6f} (pool {best[2]}, ${best[1]:,.0f})", file=sys.stderr)
        if dry_run:
            continue
        for chain_asset in [asset_id, *variants]:
            added = write_prices(records, chain_asset, new)
            print(f"{chain_asset}: {added} prices added", file=sys.stderr)


if __name__ == "__main__":
    args = sys.argv[2:]
    main(sys.argv[1], "--dry-run" in args, [a for a in args if a.startswith("0x")])
