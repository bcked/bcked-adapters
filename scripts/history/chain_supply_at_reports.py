"""Copies a token's supply per chain at its report dates to the chain assets' supply records.

Usage: python3 chain_supply_at_reports.py <records dir> <token> <chain>=<asset id>...
Example: python3 chain_supply_at_reports.py ../bcked-records usdg "X Layer"=xlayer:0x4ae4...

The backing ratio of a chain asset compares its backing at a report date with its market cap at
that time, so the asset needs a supply record near each report date. The crawler records supply
only from the day an asset was added. This writes the chain column of tokens/<token>/records/supply.csv
as circulating supply of the chain asset, for every report date the asset has no supply row for.
Existing rows are kept.
"""
import csv
import os
import sys

COLUMNS = ["timestamp", "burned", "circulating", "issued", "max", "total"]


def main(records, token, pairs):
    with open(os.path.join(records, "tokens", token, "records", "supply.csv")) as f:
        reports = list(csv.DictReader(f))
    for pair in pairs:
        chain, asset = pair.split("=", 1)
        path = os.path.join(records, "assets", asset, "records", "supply.csv")
        rows = {}
        if os.path.exists(path):
            with open(path) as f:
                rows = {row["timestamp"]: row for row in csv.DictReader(f)}
        added = 0
        for report in reports:
            value = report.get(chain)
            # A chain without tokens yet gets no row: a market cap of 0 has no backing ratio.
            if value not in (None, "", "0") and report["timestamp"] not in rows:
                rows[report["timestamp"]] = {"timestamp": report["timestamp"], "circulating": value}
                added += 1
        with open(path, "w", newline="") as f:
            writer = csv.DictWriter(f, COLUMNS, lineterminator="\n", extrasaction="ignore")
            writer.writeheader()
            for timestamp in sorted(rows):
                writer.writerow({c: rows[timestamp].get(c, "") for c in COLUMNS})
        print(f"{asset}: {added} report dates added", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3:])
