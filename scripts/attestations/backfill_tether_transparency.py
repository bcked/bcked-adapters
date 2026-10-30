"""Monthly totals of Tether's reserves from its archived transparency page, for the reports gap.

Usage: python3 backfill_tether_transparency.py <from YYYYMM> <to YYYYMM> > tether-transparency.json

Tether published no reserve reports from 2018-11 to 2021-01. Its transparency page
(wallet.tether.to/transparency) stated "USD₮ Total Assets", without a breakdown. The Wayback Machine
archived it several times a month. For every month this takes the last capture that states the
total and prints [capture timestamp, total assets, total liabilities]. The totals are Tether's own,
unaudited. They are recorded as rwa:undefined ("Composition not reported") on the tether entity.
USDT on Ethereum gets its share by the circulating supply on that day (see chainShare in
src/crawler/adapters/issuer_backing.ts), with the reserves as total where DefiLlama misses Omni.
"""
import gzip
import json
import re
import sys
import time
import urllib.request

PAGE = "wallet.tether.to/transparency"


def get(url):
    for attempt in range(4):
        try:
            body = urllib.request.urlopen(url, timeout=60).read()
            return gzip.decompress(body) if body[:2] == b"\x1f\x8b" else body
        except Exception:
            time.sleep(3 * (attempt + 1))
    return b""


def total(timestamp):
    html = get(f"https://web.archive.org/web/{timestamp}id_/https://{PAGE}").decode("utf-8", "ignore")
    text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))
    assets = re.search(r"USD₮ Total Assets \$([\d,]+\.\d+)", text)
    liabilities = re.search(r"Total Liabilities \$([\d,]+\.\d+)", text)
    if not assets:
        return None
    value = lambda m: float(m.group(1).replace(",", "")) if m else None
    return value(assets), value(liabilities)


def main(start, end):
    cdx = f"https://web.archive.org/cdx/search/cdx?url={PAGE}&from={start}&to={end}&output=json&fl=timestamp&filter=statuscode:200"
    months = {}
    for (timestamp,) in json.loads(get(cdx))[1:]:
        months.setdefault(timestamp[:6], []).append(timestamp)
    rows = []
    for month, captures in sorted(months.items()):
        for timestamp in sorted(captures, reverse=True)[:12]:
            found = total(timestamp)
            if found:
                rows.append([timestamp, *found])
                break
    print(json.dumps(rows))


if __name__ == "__main__":
    main(*sys.argv[1:3])
