"""Daily price and circulating supply for tokens that were added after their backing history.

Usage: python3 backfill_chain_tokens.py <records checkout>

The backing ratio needs a market cap at each backing date. Tokens whose backing comes from the
issuer's reports get that history at once, but the crawler records price and supply only from the
day a token is added. This fills both, one row per day from the first backing date until yesterday,
at 00:00 UTC. Days that already have a row are skipped, so the script can be run again.

Sources: DefiLlama coins API (price), DefiLlama stablecoins API (circulating supply per chain).

USDC on Arbitrum and Polygon starts at Circle's native launch there (2023-06-08 and 2023-10-10). The
earlier rows of DefiLlama's chain supply are bridged USDC.e and were removed from the records.
"""
import csv
import datetime
import json
import os
import sys
import time
import urllib.request

# Asset id, DefiLlama stablecoin id, DefiLlama chain name.
TOKENS = [
    ("tron:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", 1, "Tron"),
    ("solana:Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", 1, "Solana"),
    ("solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 2, "Solana"),
    ("base:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 2, "Base"),
    ("arbitrum:0xaf88d065e77c8cC2239327C5EDb3A432268e5831", 2, "Arbitrum"),
    ("polygon:0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", 2, "Polygon"),
]
DAY = 24 * 60 * 60


def get(url):
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "bcked-backfill"})
            return json.load(urllib.request.urlopen(req, timeout=60))
        except Exception:
            time.sleep(2**attempt)
    raise RuntimeError(url)


def iso(day):
    return datetime.datetime.fromtimestamp(day, datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def merge(path, columns, rows):
    """Adds rows for days without a row, keeps the file's columns and sorts by timestamp."""
    existing = list(csv.DictReader(open(path))) if os.path.exists(path) else []
    header = list(existing[0].keys()) if existing else columns
    days = {r["timestamp"][:10] for r in existing}
    new = [r for r in rows if r["timestamp"][:10] not in days]
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=header, lineterminator="\n")
        writer.writeheader()
        writer.writerows(sorted(existing + new, key=lambda r: r["timestamp"]))
    return len(new)


def main(records):
    today = int(time.time()) // DAY * DAY
    supplies = {}
    for asset, stablecoin, chain in TOKENS:
        folder = os.path.join(records, "assets", asset, "records")
        with open(os.path.join(folder, "backing.csv")) as f:
            first = min(r["timestamp"] for r in csv.DictReader(f))
        start = int(datetime.datetime.fromisoformat(first[:10]).replace(tzinfo=datetime.timezone.utc).timestamp())
        if stablecoin not in supplies:
            supplies[stablecoin] = get(f"https://stablecoins.llama.fi/stablecoin/{stablecoin}")
        tokens = supplies[stablecoin]["chainBalances"][chain]["tokens"]
        supply = {p["date"] // DAY * DAY: p["circulating"].get("peggedUSD") for p in tokens}
        prices = {}
        for chunk in range(start, today, 300 * DAY):
            span = min(300, (today - chunk) // DAY)
            data = get(f"https://coins.llama.fi/chart/{asset}?start={chunk}&span={span}&period=1d")
            for p in data["coins"].get(asset, {}).get("prices", []):
                prices[p["timestamp"] // DAY * DAY] = p["price"]
        days = range(start, today, DAY)
        price_rows = [{"timestamp": iso(d), "usd": prices[d]} for d in days if d in prices]
        supply_rows = [
            {"timestamp": iso(d), "circulating": supply[d], "burned": "", "issued": "", "max": "", "total": ""}
            for d in days
            if supply.get(d)
        ]
        added_price = merge(os.path.join(folder, "price.csv"), ["timestamp", "usd"], price_rows)
        added_supply = merge(
            os.path.join(folder, "supply.csv"),
            ["timestamp", "burned", "circulating", "issued", "max", "total"],
            supply_rows,
        )
        print(f"{asset}: {added_price} prices, {added_supply} supplies from {first[:10]}", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
