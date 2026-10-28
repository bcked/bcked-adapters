"""Converts reserves reported in USD into units of the underlying asset, using the price at the report time.

Usage: python3 convert_prices.py <extracted.json> > converted.json

Keys "usd:BTC" and "usd:XAU" become "bitcoin:BTC" and "rwa:XAU". Prices come from the DefiLlama
historical price API. The gold price is taken from PAX Gold (one token is one fine troy ounce).
"""
import datetime
import json
import sys
import urllib.request

COINS = {"usd:BTC": ("bitcoin:BTC", "coingecko:bitcoin"), "usd:XAU": ("rwa:XAU", "coingecko:pax-gold")}


def price(coin, timestamp):
    unix = int(datetime.datetime.fromisoformat(timestamp.replace("Z", "+00:00")).timestamp())
    url = f"https://coins.llama.fi/prices/historical/{unix}/{coin}?searchWidth=12h"
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)["coins"][coin]["price"]


def main(path):
    reports = json.load(open(path))
    for report in reports:
        for section in report["sections"]:
            for key, (asset, coin) in COINS.items():
                if key in section["cat"]:
                    usd = section["cat"].pop(key)
                    p = price(coin, section["timestamp"])
                    section["cat"][asset] = round(usd / p, 6)
                    section.setdefault("prices", {})[asset] = p
    print(json.dumps(reports))


if __name__ == "__main__":
    main(sys.argv[1])
