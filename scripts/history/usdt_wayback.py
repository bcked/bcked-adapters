"""Records Tether's circulating USDT per chain at each USDT report date, from archived copies of
Tether's transparency data (https://app.tether.to/transparency.json) in the Wayback Machine.

Usage: python3 usdt_wayback.py <records checkout>

For each report date in tokens/usdt/records/backing.csv, the snapshot closest in time (at most
3 days away) is read. Circulating on a chain is Tether's tokens issued there less its treasury
and quarantined tokens, the same figures the crawler records daily (src/crawler/adapters/
circulating.ts). Rows are added to tokens/usdt/records/supply.csv with the total and the chains
bcked tracks, and to each chain asset's supply.csv as its circulating supply, so its market cap
exists at the report date. Existing rows are kept. Snapshots exist from 2022.
"""
import csv
import datetime
import gzip
import json
import os
import sys
import time
import urllib.request

URL = "https://app.tether.to/transparency.json"
CHAINS = {"Ethereum": "eth", "Tron": "tron", "Solana": "sol"}
ASSETS = {
    "Ethereum": "ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "Tron": "tron:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    "Solana": "solana:Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
}
SUPPLY_COLUMNS = ["timestamp", "burned", "circulating", "issued", "max", "total"]
MAX_DISTANCE = datetime.timedelta(days=3)
HEADERS = {"User-Agent": "bcked.com history rebuild (https://bcked.com)"}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=120) as response:
        data = response.read()
    while data[:2] == b"\x1f\x8b":  # the archive stores the data gzip-compressed, sometimes twice
        data = gzip.decompress(data)
    return data


def snapshots():
    rows = json.loads(get(f"https://web.archive.org/cdx/search/cdx?url={URL}&output=json&fl=timestamp&filter=statuscode:200"))
    return [datetime.datetime.strptime(row[0], "%Y%m%d%H%M%S").replace(tzinfo=datetime.timezone.utc) for row in rows[1:]]


def circulating(usdt, chain):
    value = lambda key: float(usdt.get(f"{key}_{chain}") or 0)
    return value("totaltokens") - value("reserve_balance") - value("quarantined")


def main(records):
    folder = os.path.join(records, "tokens", "usdt", "records")
    with open(os.path.join(folder, "backing.csv")) as f:
        reports = sorted({row["timestamp"] for row in csv.DictReader(f)})
    path = os.path.join(folder, "supply.csv")
    existing = {}
    if os.path.exists(path):
        with open(path) as f:
            for row in csv.DictReader(f):
                existing[row["timestamp"]] = row
    found = snapshots()
    added = 0
    for report in reports:
        time_ = datetime.datetime.fromisoformat(report.replace("Z", "+00:00"))
        closest = min(found, key=lambda t: abs(t - time_), default=None)
        if not closest or abs(closest - time_) > MAX_DISTANCE:
            continue
        timestamp = closest.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        if timestamp in existing:
            continue
        usdt = json.loads(get(f"https://web.archive.org/web/{closest:%Y%m%d%H%M%S}id_/{URL}"))["data"]["usdt"]
        chains = sorted({key.split("_", 1)[1] for key in usdt if key.startswith("totaltokens_")})
        row = {"timestamp": timestamp, "total": round(sum(circulating(usdt, c) for c in chains), 6)}
        row.update({name: round(circulating(usdt, key), 6) for name, key in CHAINS.items()})
        existing[timestamp] = row
        added += 1
        print(f"{report[:10]}: snapshot {timestamp}, total {row['total'] / 1e9:.2f}B", file=sys.stderr)
        time.sleep(1)
    columns = ["timestamp", "total", *CHAINS]
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, columns, lineterminator="\n", extrasaction="ignore")
        writer.writeheader()
        for timestamp in sorted(existing):
            writer.writerow({c: existing[timestamp].get(c, "") for c in columns})
    print(f"{added} report dates added", file=sys.stderr)

    # Each chain asset gets the same figures as its circulating supply.
    for name, asset in ASSETS.items():
        path = os.path.join(records, "assets", asset, "records", "supply.csv")
        rows = {}
        if os.path.exists(path):
            with open(path) as f:
                rows = {row["timestamp"]: row for row in csv.DictReader(f)}
        for timestamp, row in existing.items():
            if row.get(name) not in (None, "") and timestamp not in rows:
                rows[timestamp] = {"timestamp": timestamp, "circulating": row[name]}
        with open(path, "w", newline="") as f:
            writer = csv.DictWriter(f, SUPPLY_COLUMNS, lineterminator="\n", extrasaction="ignore")
            writer.writeheader()
            for timestamp in sorted(rows):
                writer.writerow({c: rows[timestamp].get(c, "") for c in SUPPLY_COLUMNS})


if __name__ == "__main__":
    main(sys.argv[1])
