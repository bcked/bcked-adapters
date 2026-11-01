"""Converts reserves reported in USD into units of the underlying asset, using the price at the report time.

Usage: python3 convert_prices.py <extracted.json> [<backing.csv>] > converted.json

Keys "usd:BTC" and "usd:XAU" become "bitcoin:BTC" and "rwa:XAU". Prices come from Chainlink's
BTC/USD and XAU/USD feeds on Ethereum, read on-chain at the last block before the report time
(https://docs.chain.link/data-feeds). With a backing.csv, only report dates after its latest row
are converted, since update.sh only appends those.

Needs an Ethereum archive RPC in the environment variable ETHEREUM_RPC (the crawler's Alchemy URL).
"""
import csv
import datetime
import json
import os
import sys
import urllib.request

FEEDS = {
    "usd:BTC": ("bitcoin:BTC", "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c"),  # BTC / USD
    "usd:XAU": ("rwa:XAU", "0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6"),  # XAU / USD
}
LATEST_ROUND_DATA = "0xfeaf968c"  # latestRoundData()


def rpc(method, params):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    request = urllib.request.Request(os.environ["ETHEREUM_RPC"], body, {"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=60) as response:
        result = json.load(response)
    if "error" in result:
        raise RuntimeError(result["error"])
    return result["result"]


def block_at(unix):
    """Number of the last block at or before a unix time (binary search)."""
    low, high = 1, int(rpc("eth_blockNumber", []), 16)
    while low < high:
        mid = (low + high + 1) // 2
        if int(rpc("eth_getBlockByNumber", [hex(mid), False])["timestamp"], 16) <= unix:
            low = mid
        else:
            high = mid - 1
    return low


def price(feed, block):
    data = rpc("eth_call", [{"to": feed, "data": LATEST_ROUND_DATA}, hex(block)])
    answer = int(data[2 + 64 : 2 + 128], 16)  # second word: int256 answer, 8 decimals
    return answer / 1e8


def latest_recorded(path):
    if not path or not os.path.exists(path):
        return ""
    with open(path) as f:
        return max((row["timestamp"] for row in csv.DictReader(f)), default="")


def main(path, backing=None):
    reports = json.load(open(path))
    after = latest_recorded(backing)
    for report in reports:
        for section in report["sections"]:
            if section["timestamp"] <= after or not any(key in section["cat"] for key in FEEDS):
                continue
            unix = int(datetime.datetime.fromisoformat(section["timestamp"].replace("Z", "+00:00")).timestamp())
            block = block_at(unix)
            for key, (asset, feed) in FEEDS.items():
                if key in section["cat"]:
                    usd = section["cat"].pop(key)
                    p = price(feed, block)
                    section["cat"][asset] = round(usd / p, 6)
                    section.setdefault("prices", {})[asset] = p
    print(json.dumps(reports))


if __name__ == "__main__":
    main(*sys.argv[1:3])
