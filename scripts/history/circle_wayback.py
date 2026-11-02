"""Records USDC on Solana at USDC report dates, from archived copies of Circle's stablecoin data
(https://api.circle.com/v1/stablecoins) in the Wayback Machine.

Usage: python3 circle_wayback.py <records checkout>

Past Solana token supply cannot be read from a Solana RPC. Circle's own data lists the USDC on
each chain. For each report date in tokens/usdc/records/supply.csv, the snapshot closest in time
(at most 3 days away) gives Solana's share of all USDC. That share of the reported total is
written as the "Solana" column of the report row, and as circulating supply of the Solana asset
at the report time, so its market cap exists at the report date. Existing values are kept.
"""
import csv
import datetime
import gzip
import json
import os
import sys
import time
import urllib.request

URL = "https://api.circle.com/v1/stablecoins"
CHAIN, COLUMN = "SOL", "Solana"
ASSET = "solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
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


def share(snapshot):
    """Solana's share of all USDC in a snapshot, or None."""
    data = json.loads(get(f"https://web.archive.org/web/{snapshot:%Y%m%d%H%M%S}id_/{URL}"))["data"]
    usdc = next((c for c in data if c["symbol"] == "USDC"), None)
    if not usdc:
        return None
    chains = {c["chain"]: float(c["amount"]) for c in usdc["chains"]}
    total = sum(chains.values())
    return chains.get(CHAIN, 0) / total if total else None


def write(path, columns, rows):
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, columns, lineterminator="\n", extrasaction="ignore")
        writer.writeheader()
        for timestamp in sorted(rows):
            writer.writerow({c: rows[timestamp].get(c, "") for c in columns})


def main(records):
    path = os.path.join(records, "tokens", "usdc", "records", "supply.csv")
    with open(path) as f:
        reader = csv.DictReader(f)
        columns = list(reader.fieldnames)
        reports = {row["timestamp"]: row for row in reader}
    if COLUMN not in columns:
        columns.append(COLUMN)
    found = snapshots()
    asset_path = os.path.join(records, "assets", ASSET, "records", "supply.csv")
    asset_rows = {}
    if os.path.exists(asset_path):
        with open(asset_path) as f:
            asset_rows = {row["timestamp"]: row for row in csv.DictReader(f)}
    added = 0
    for timestamp, row in sorted(reports.items()):
        if row.get(COLUMN) or not row.get("total"):
            continue
        time_ = datetime.datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        closest = min(found, key=lambda t: abs(t - time_), default=None)
        if not closest or abs(closest - time_) > MAX_DISTANCE:
            continue
        part = share(closest)
        if not part:
            continue
        value = round(part * float(row["total"]), 6)
        row[COLUMN] = value
        if timestamp not in asset_rows:
            asset_rows[timestamp] = {"timestamp": timestamp, "circulating": value}
        added += 1
        print(f"{timestamp[:10]}: snapshot {closest:%Y-%m-%d}, Solana {part:.2%}, {value / 1e9:.2f}B", file=sys.stderr)
        time.sleep(1)
    write(path, columns, reports)
    write(asset_path, SUPPLY_COLUMNS, asset_rows)
    print(f"{added} report dates added", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1])
