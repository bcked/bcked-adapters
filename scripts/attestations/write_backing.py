"""Writes extracted attestation data to the records of an asset or entity.

Usage: python3 write_backing.py <extracted.json> <records dir> <evidence prefix> [--keep <from> <to> | --append] [--evidence <dir>]
Example: python3 write_backing.py busd.json "assets/ethereum:0x4Fabb.../records" BUSD

- Rewrites <records dir>/backing.csv with one row per report date and one column per underlying asset.
- With --keep, existing rows with a timestamp between <from> and <to> (inclusive) are kept and report
  dates in that range are left out. Used where an automated source covers that period (Circle).
- With --append, all existing rows are kept and only report dates after the latest row are added.
  Used by update.sh, which only downloads new reports.
- Lists every report in <records dir>/evidence.csv as <prefix>-<YYYY-MM>-Attestation-report.pdf with
  its SHA-256 hash and download URL, unless a report for that month is already listed.
- With --evidence, copies new reports to <dir>/<year>/<file>. The reports belong to their issuers and
  auditors and are kept in the private repository bcked/bcked-evidence, not on the public records branch.
"""
import csv
import datetime
import hashlib
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


def sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def source_url(path):
    """Download URL from sources.json next to the report, written by the fetch scripts."""
    sources = os.path.join(os.path.dirname(path), "sources.json")
    if not os.path.exists(sources):
        return ""
    return json.load(open(sources)).get(os.path.basename(path), "")


INDEX_COLUMNS = ["report", "file", "sha256", "url"]


def read_index(records):
    path = os.path.join(records, "evidence.csv")
    if not os.path.exists(path):
        return {}
    with open(path) as f:
        return {row["file"]: row for row in csv.DictReader(f)}


def write_index(records, index):
    with open(os.path.join(records, "evidence.csv"), "w", newline="") as f:
        writer = csv.DictWriter(f, INDEX_COLUMNS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(sorted(index.values(), key=lambda row: row["file"]))


def main(extracted, records, prefix, keep=None, append=False, evidence=None):
    path = os.path.join(records, "backing.csv")
    reports = [r for r in json.load(open(extracted)) if r["sections"]]
    if append:
        existing = existing_rows(path, "", "9999")
        latest = max((timestamp for timestamp, _ in existing), default="")
        for report in reports:
            report["sections"] = [s for s in report["sections"] if s["timestamp"] > latest]
        reports = [r for r in reports if r["sections"]]
    rows = [(s["timestamp"], s["cat"]) for r in reports for s in r["sections"]]
    if append:
        rows += existing
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
    index = read_index(records)
    for report in reports:
        # Name the evidence by the report's own (local) date, which can differ from the UTC date.
        last = max(report["sections"], key=lambda s: s["timestamp"])
        month = datetime.datetime.strptime(last["date"].replace(",", ""), "%B %d %Y").strftime("%Y-%m")
        name = f"{prefix}-{month}-Attestation-report.pdf"
        if name in index:
            continue
        index[name] = {"report": month, "file": name, "sha256": sha256(report["file"]), "url": source_url(report["file"])}
        added += 1
        if evidence:
            target = os.path.join(evidence, month[:4], name)
            os.makedirs(os.path.dirname(target), exist_ok=True)
            shutil.copy(report["file"], target)
    write_index(records, index)
    print(f"{len(rows)} rows, {len(columns)} columns, {added} new reports", file=sys.stderr)


if __name__ == "__main__":
    args = sys.argv[1:]
    keep = None
    append = "--append" in args
    args = [a for a in args if a != "--append"]
    evidence = None
    if "--evidence" in args:
        i = args.index("--evidence")
        evidence = args[i + 1]
        args = args[:i] + args[i + 2 :]
    if "--keep" in args:
        i = args.index("--keep")
        keep = (args[i + 1], args[i + 2])
        args = args[:i] + args[i + 3 :]
    main(*args[:3], keep=keep, append=append, evidence=evidence)
