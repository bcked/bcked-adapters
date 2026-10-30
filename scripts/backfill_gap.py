"""Fills a gap in the crawled records with one row per day from historical sources.

Usage: python3 backfill_gap.py <records checkout> <from YYYY-MM-DD> <to YYYY-MM-DD>
Example: python3 backfill_gap.py ../records 2025-11-30 2026-10-27

Used after the crawler was switched off from 2025-11-30 to 2026-10-27. Rows are written at 00:00 UTC.
Days that already have a row in a file are skipped, so the script can be run again.

Sources:
- Token prices: DefiLlama coins API (daily).
- ERC-20 supply and burned tokens, ETH held by WETH: contract calls at the first block of the day
  (block from DefiLlama, archive node from drpc.org). Burned tokens use the burn addresses of
  src/crawler/chains/evm.ts.
- USDT and USDC: circulating supply on Ethereum from the DefiLlama stablecoins API.
- BTC issued supply: block height at the start of the day from mempool.space.
- ETH supply: ultrasound.money (total supply after burns, daily since the Merge).
- Gold: daily spot rate from the currency-api dataset on jsdelivr (matches the Swissquote records).

WBTC backing is backfilled separately by backfill_wbtc_custody.py.
"""
import csv
import datetime
import json
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

UA = {"User-Agent": "Mozilla/5.0", "Content-Type": "application/json"}
RPC = "https://eth.drpc.org"
BURN_ADDRESSES = [
    "0x000000000000000000000000000000000000dEaD",
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000002",
    "0x0000000000000000000000000000000000000003",
    "0x0000000000000000000000000000000000000004",
]
TOKENS = {  # address: decimals
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": 8,  # WBTC
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": 18,  # WETH
    "0x45804880De22913dAFE09f4980848ECE6EcbAf78": 18,  # PAXG
    "0x4Fabb145d64652a948d72533023f6E7A623C7C53": 18,  # BUSD
}
STABLECOINS = {  # address: (DefiLlama stablecoin ID, DefiLlama coin ID for the price)
    "0xdAC17F958D2ee523a2206206994597C13D831ec7": (1, "tether"),
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": (2, "usd-coin"),
}
WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"


def get(url, data=None):
    for attempt in range(5):
        try:
            request = urllib.request.Request(url, data=data, headers=UA)
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.loads(response.read())
        except Exception:
            if attempt == 4:
                raise
            time.sleep(2**attempt)


def iso(ts):
    return datetime.datetime.fromtimestamp(ts, datetime.UTC).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def rpc_batch(calls):
    """Runs JSON-RPC calls in batches of 3 (the drpc.org free plan limit) and returns the results in order."""

    def run(batch_calls):
        batch = [{"jsonrpc": "2.0", "id": j, "method": m, "params": p} for j, (m, p) in enumerate(batch_calls)]
        for attempt in range(5):
            response = sorted(get(RPC, json.dumps(batch).encode()), key=lambda r: r["id"])
            if all("result" in r for r in response):
                return [int(r["result"], 16) for r in response]
            time.sleep(2**attempt)
        raise RuntimeError(f"RPC error: {response}")

    chunks = [calls[i : i + 3] for i in range(0, len(calls), 3)]
    with ThreadPoolExecutor(6) as pool:
        return [value for chunk in pool.map(run, chunks) for value in chunk]


def balance_of(token, holder, block):
    data = "0x70a08231" + holder[2:].lower().rjust(64, "0")
    return ("eth_call", [{"to": token, "data": data}, hex(block)])


def merge(path, new):
    """Adds rows for days without a row in the file and keeps the file sorted."""
    with open(path) as f:
        header = f.readline().strip().split(",")
    rows = list(csv.DictReader(open(path)))
    days = {r["timestamp"][:10] for r in rows}
    new = [r for r in new if r["timestamp"][:10] not in days]
    rows = sorted(rows + new, key=lambda r: r["timestamp"])
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, header, lineterminator="\n", restval="")
        writer.writeheader()
        writer.writerows(rows)
    print(f"{path}: +{len(new)}", file=sys.stderr)


def fmt(value):
    return repr(float(value))


def btc_issued(height):
    supply, reward = 0, 50 * 10**8
    for _ in range(height // 210000):
        supply += 210000 * reward
        reward //= 2
    return (supply + (height % 210000) * reward) / 10**8


def gold_prices(days):
    """Daily spot gold in USD from the currency-api dataset (https://github.com/fawazahmed0/exchange-api)."""

    def rate(day):
        date = iso(day)[:10]
        url = f"https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/v1/currencies/xau.min.json"
        try:
            return {"timestamp": iso(day), "usd": fmt(get(url)["xau"]["usd"])}
        except Exception:
            return None

    with ThreadPoolExecutor(6) as pool:
        return [row for row in pool.map(rate, days) if row]


def main(root, start, end):
    assets = os.path.join(root, "assets")
    first = datetime.datetime.fromisoformat(start).replace(tzinfo=datetime.UTC)
    last = datetime.datetime.fromisoformat(end).replace(tzinfo=datetime.UTC)
    days = [int((first + datetime.timedelta(days=i)).timestamp()) for i in range((last - first).days + 1)]

    # Prices
    coins = {"bitcoin:BTC": "coingecko:bitcoin", "ethereum:ETH": "coingecko:ethereum"}
    coins |= {f"ethereum:{a}": f"ethereum:{a}" for a in TOKENS}
    prices = {}
    for asset, coin in coins.items():
        chart = get(f"https://coins.llama.fi/chart/{coin}?start={days[0]}&span={len(days)}&period=1d")
        points = chart["coins"].get(coin, {}).get("prices", [])
        prices[asset] = [{"timestamp": iso(day), "usd": fmt(p["price"])} for day in days for p in points if abs(p["timestamp"] - day) < 3600]
    stable_prices = {p["date"]: p["prices"] for p in get("https://stablecoins.llama.fi/stablecoinprices")}
    for address, (_, coin) in STABLECOINS.items():
        prices[f"ethereum:{address}"] = [
            {"timestamp": iso(day), "usd": fmt(stable_prices[day][coin])} for day in days if coin in stable_prices.get(day, {})
        ]
    prices["rwa:XAU"] = gold_prices(days)
    for asset, rows in prices.items():
        merge(os.path.join(assets, asset, "records", "price.csv"), rows)

    # ERC-20 supply and WETH backing at the first block of each day
    with ThreadPoolExecutor(6) as pool:
        blocks = [b["height"] for b in pool.map(lambda day: get(f"https://coins.llama.fi/block/ethereum/{day}"), days)]
    for address, decimals in TOKENS.items():
        calls = []
        for block in blocks:
            calls.append(("eth_call", [{"to": address, "data": "0x18160ddd"}, hex(block)]))
            calls += [balance_of(address, holder, block) for holder in BURN_ADDRESSES]
        values = rpc_batch(calls)
        rows = []
        for i, day in enumerate(days):
            chunk = values[i * 7 : i * 7 + 7]
            issued, burned = chunk[0] / 10**decimals, sum(chunk[1:]) / 10**decimals
            rows.append({"timestamp": iso(day), "burned": fmt(burned), "issued": fmt(issued), "total": fmt(issued - burned)})
        merge(os.path.join(assets, f"ethereum:{address}", "records", "supply.csv"), rows)
    balances = rpc_batch([("eth_getBalance", [WETH, hex(block)]) for block in blocks])
    merge(
        os.path.join(assets, f"ethereum:{WETH}", "records", "backing.csv"),
        [{"timestamp": iso(day), "underlying.ethereum:ETH": fmt(b / 10**18)} for day, b in zip(days, balances)],
    )

    # USDT and USDC circulating supply on Ethereum
    for address, (stablecoin, _) in STABLECOINS.items():
        tokens = get(f"https://stablecoins.llama.fi/stablecoin/{stablecoin}")["chainBalances"]["Ethereum"]["tokens"]
        supply = {p["date"]: p["circulating"]["peggedUSD"] for p in tokens if p.get("circulating", {}).get("peggedUSD")}
        merge(
            os.path.join(assets, f"ethereum:{address}", "records", "supply.csv"),
            [{"timestamp": iso(day), "circulating": fmt(supply[day])} for day in days if day in supply],
        )

    # BTC issued supply
    with ThreadPoolExecutor(4) as pool:
        heights = [b["height"] for b in pool.map(lambda day: get(f"https://mempool.space/api/v1/mining/blocks/timestamp/{day}"), days)]
    merge(
        os.path.join(assets, "bitcoin:BTC", "records", "supply.csv"),
        [{"timestamp": iso(day), "issued": fmt(btc_issued(h)), "max": "21000000"} for day, h in zip(days, heights)],
    )

    # ETH supply
    eth = get("https://ultrasound.money/api/v2/fees/supply-over-time")["since_merge"]
    eth = {int(datetime.datetime.fromisoformat(p["timestamp"].replace("Z", "+00:00")).timestamp()): p["supply"] for p in eth}
    merge(
        os.path.join(assets, "ethereum:ETH", "records", "supply.csv"),
        [{"timestamp": iso(day), "total": fmt(eth[day])} for day in days if day in eth],
    )


if __name__ == "__main__":
    main(*sys.argv[1:4])
