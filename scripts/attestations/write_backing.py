"""Writes extracted attestation data to the records of an asset.

Usage: python3 write_backing.py <extracted.json> <records dir> <evidence prefix>
Example: python3 write_backing.py busd.json "assets/ethereum:0x4Fabb.../records" BUSD

- Rewrites <records dir>/backing.csv with one row per report date and one column per underlying asset.
- Copies every report to <records dir>/evidence/<year>/<prefix>-<YYYY-MM>-Attestation-report.pdf,
  unless a report for that month is already stored.
"""
import json
import os
import shutil
import sys


def fmt(value):
    """Shortest exact representation, without a trailing .0 for whole numbers."""
    if value is None:
        return ""
    return str(int(value)) if float(value).is_integer() else repr(float(value))


def main(extracted, records, prefix):
    reports = [r for r in json.load(open(extracted)) if r["sections"]]
    sections = sorted((s for r in reports for s in r["sections"]), key=lambda s: s["timestamp"])
    columns = sorted({key for s in sections for key in s["cat"]})
    with open(os.path.join(records, "backing.csv"), "w") as f:
        f.write("timestamp," + ",".join(f"underlying.{c}" for c in columns) + "\n")
        for s in sections:
            f.write(s["timestamp"] + "," + ",".join(fmt(s["cat"].get(c)) for c in columns) + "\n")

    added = 0
    for report in reports:
        month = max(s["timestamp"] for s in report["sections"])[:7]
        target = os.path.join(records, "evidence", month[:4], f"{prefix}-{month}-Attestation-report.pdf")
        if not os.path.exists(target):
            os.makedirs(os.path.dirname(target), exist_ok=True)
            shutil.copy(report["file"], target)
            added += 1
    print(f"{len(sections)} rows, {len(columns)} columns, {added} new evidence files", file=sys.stderr)


if __name__ == "__main__":
    main(*sys.argv[1:4])
