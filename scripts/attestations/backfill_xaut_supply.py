"""Supply and price of Tether Gold (XAUt) at its report dates, for the reports before it was tracked.

Usage: python3 backfill_xaut_supply.py <xaut.json> <records dir of XAUT>

<xaut.json> is written by extract_xaut.py. The backing ratio needs a market cap at each report
date, but the crawler records supply and price only from the day XAUt was added. The supply at a
report date is the tokens in circulation that the report states (all minted tokens, which the gold
covers). Prices are daily from the DefiLlama coins API. Rows that exist are kept.
"""
import csv
import datetime
import json
import os
import sys
import urllib.request

ASSET = "ethereum:0x68749665FF8D2d112Fa859AA293F07A622782F38"
DAY = 24 * 60 * 60


def merge(path, columns, rows):
    existing = list(csv.DictReader(open(path))) if os.path.exists(path) else []
    header = list(existing[0].keys()) if existing else columns
    have = {r["timestamp"] for r in existing}
    new = [r for r in rows if r["timestamp"] not in have]
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=header, lineterminator="\n")
        writer.writeheader()
        writer.writerows(sorted(existing + new, key=lambda r: r["timestamp"]))
    return len(new)


def main(extracted, records):
    sections = [s for report in json.load(open(extracted)) for s in report["sections"]]
    supply = [
        {"timestamp": s["timestamp"], "burned": "", "circulating": "", "issued": s["total"], "max": "", "total": s["total"]}
        for s in sections
    ]
    prices = []
    for s in sections:
        # The price of the report day, from the daily chart around it.
        day = int(datetime.datetime.fromisoformat(s["timestamp"][:10]).replace(tzinfo=datetime.timezone.utc).timestamp())
        url = f"https://coins.llama.fi/chart/{ASSET}?start={day}&span=2&period=1d"
        request = urllib.request.Request(url, headers={"User-Agent": "bcked-backfill"})
        points = json.load(urllib.request.urlopen(request, timeout=60))["coins"].get(ASSET, {}).get("prices", [])
        if points:
            closest = min(points, key=lambda p: abs(p["timestamp"] - (day + DAY - 60)))
            prices.append({"timestamp": s["timestamp"], "usd": closest["price"]})
    print("supply rows", merge(os.path.join(records, "supply.csv"), ["timestamp", "burned", "circulating", "issued", "max", "total"], supply), file=sys.stderr)
    print("price rows", merge(os.path.join(records, "price.csv"), ["timestamp", "usd"], prices), file=sys.stderr)


if __name__ == "__main__":
    main(*sys.argv[1:3])
