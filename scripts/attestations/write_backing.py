"""Writes extracted attestation data to the records of an asset or entity.

Usage: python3 write_backing.py <extracted.json> <records dir> <evidence prefix> [--keep <from> <to>]
Example: python3 write_backing.py busd.json "assets/ethereum:0x4Fabb.../records" BUSD

- Rewrites <records dir>/backing.csv with one row per report date and one column per underlying asset.
- With --keep, existing rows with a timestamp between <from> and <to> (inclusive) are kept and report
  dates in that range are left out. Used where an automated source covers that period (Circle).
- Copies every report to <records dir>/evidence/<year>/<prefix>-<YYYY-MM>-Attestation-report.pdf,
  unless a report for that month is already stored.
"""
import csv
import datetime
import json
import os
import shutil
import sys


def fmt(value):
    """Shortest exact representation, without a trailing .0 for whole numbers."""
    if value is None or value == "":
        return ""
    return str(int(value)) if float(value).is_integer() else repr(float(value))


def existing_rows(path, start, end):
    """Rows of the current backing.csv within [start, end], as (timestamp, {asset: value})."""
    if not os.path.exists(path):
        return []
    rows = []
    with open(path) as f:
        for row in csv.DictReader(f):
            if start <= row["timestamp"] <= end:
                cat = {k.removeprefix("underlying."): float(v) for k, v in row.items() if k != "timestamp" and v}
                rows.append((row["timestamp"], cat))
    return rows


def main(extracted, records, prefix, keep=None):
    path = os.path.join(records, "backing.csv")
    reports = [r for r in json.load(open(extracted)) if r["sections"]]
    rows = [(s["timestamp"], s["cat"]) for r in reports for s in r["sections"]]
    if keep:
        start, end = keep
        rows = [row for row in rows if not start <= row[0] <= end] + existing_rows(path, start, end)
    rows.sort(key=lambda row: row[0])
    columns = sorted({key for _, cat in rows for key in cat})
    with open(path, "w") as f:
        f.write("timestamp," + ",".join(f"underlying.{c}" for c in columns) + "\n")
        for timestamp, cat in rows:
            f.write(timestamp + "," + ",".join(fmt(cat.get(c)) for c in columns) + "\n")

    added = 0
    for report in reports:
        # Name the evidence by the report's own (local) date, which can differ from the UTC date.
        last = max(report["sections"], key=lambda s: s["timestamp"])
        month = datetime.datetime.strptime(last["date"].replace(",", ""), "%B %d %Y").strftime("%Y-%m")
        target = os.path.join(records, "evidence", month[:4], f"{prefix}-{month}-Attestation-report.pdf")
        if not os.path.exists(target):
            os.makedirs(os.path.dirname(target), exist_ok=True)
            shutil.copy(report["file"], target)
            added += 1
    print(f"{len(rows)} rows, {len(columns)} columns, {added} new evidence files", file=sys.stderr)


if __name__ == "__main__":
    args = sys.argv[1:]
    keep = None
    if "--keep" in args:
        i = args.index("--keep")
        keep = (args[i + 1], args[i + 2])
        args = args[:i] + args[i + 3 :]
    main(*args[:3], keep=keep)
