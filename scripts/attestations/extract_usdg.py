"""Extracts the USDG reserve composition per report date from Paxos's Redemption Assets Reports.

Usage: python3 extract_usdg.py usdg_manual.json <report.pdf>... > usdg.json

Prints JSON in the format of extract_busd.py: one entry per report with its sections (report date,
assets by category, reported total). Each report covers two dates.

- Since 2026-03 the reports have an Exhibit B with cash, government money market funds, repurchase
  agreements and Treasury obligations (bills of at most three months). Reports since 2026-01 have the
  same table, but only as outlines without text, so they are read manually.
- Until 2025-12 the reports list Treasury bills and one total of "Cash and Cash Equivalents", which
  mixes bank deposits and money market funds and is recorded as composition not reported. Some of these
  reports have no text layer either.

Each section also has the reported number of USDG tokens outstanding ("supply": {"total": ...}). The
chain shares of the reserves are taken against it (see getTokenBackingShare). Where DefiLlama has no
supply per chain yet (before 2025-07), the chains are given too: until 2025-02 all tokens were on
Ethereum, and in 2025-03 and 2025-05 Ethereum is its totalSupply at the report time, read with an
archive call, and Solana the rest.

Reports or dates without text are read manually and kept in usdg_manual.json, by file name and date.
An entry has the reserves ("cat"), the supply ("supply") or both.
Until 2025-12 the reports are as of 5:00 pm Singapore time, later ones as of 5:00 pm US Eastern time.
"""
import datetime
import json
import os
import re
import sys
from zoneinfo import ZoneInfo

from pdftext import pdf_text

MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December"
AMOUNT = r"\$?([\d,]{3,}|-)"
EXHIBIT_B = {
    "Cash": "rwa:USD",
    "Government money market funds": "rwa:MMF",
    "Repurchase agreements": "rwa:USTrepo",
    "Obligations of U.S. Treasury": "rwa:USTB",
}


def num(s):
    return 0.0 if s == "-" else float(s.replace(",", ""))


def report_dates(flat):
    m = re.search(rf"as of (\d{{1,2}} (?:{MONTHS}) 20\d\d) and (\d{{1,2}} (?:{MONTHS}) 20\d\d)", flat)
    if not m:
        return []
    return [datetime.datetime.strptime(d, "%d %B %Y").date() for d in m.groups()]


def to_utc(date, zone):
    local = datetime.datetime(date.year, date.month, date.day, 17, tzinfo=ZoneInfo(zone))
    return local.astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def exhibit_b(lines):
    """Two columns of the Exhibit B summary table."""
    start = next((i for i, l in enumerate(lines) if "Exhibit B: Composition" in l), None)
    if start is None:
        return None
    cats = [{}, {}]
    totals = None
    table = [l.strip() for l in lines[start : start + 20]]
    for j, label in enumerate(table):
        amounts = re.findall(AMOUNT + r"(?=\s|$)", label)
        for name, key in EXHIBIT_B.items():
            if not label.startswith(name):
                continue
            # Long labels wrap, their amounts can stand on the line below or above.
            for candidate in (label, table[j + 1], table[j - 1]):
                found = re.findall(AMOUNT + r"(?=\s|$)", candidate)
                if len(found) == 2:
                    for i in range(2):
                        if num(found[i]):
                            cats[i][key] = num(found[i])
                    break
        if label.startswith("Total") and len(amounts) == 2:
            totals = [num(a) for a in amounts]
            break
    return (cats, totals) if totals else None


def bill_totals(text):
    """Treasury bills and cash and cash equivalents per date, from the totals under each table."""
    bills = re.findall(r"Total U\.S\. Treasury Bills:?\s+" + AMOUNT, text)
    cash = re.findall(r"Total Cash and Cash Equivalents:?\s+" + AMOUNT, text)
    total = re.findall(r"Total of Redemption Assets:?\s+" + AMOUNT, text)
    n = min(len(bills), len(cash), len(total))
    cats = [{"rwa:USTB": num(bills[i]), "rwa:undefined": num(cash[i])} for i in range(n)]
    return cats, [num(t) for t in total[:n]]


def token_totals(flat):
    """USDG tokens outstanding at both report dates."""
    for pattern in (r"Exhibit A line d\)\s+([\d,]+)\s+([\d,]+)", r"USDG tokens in circulation\s+([\d,]+)\s+([\d,]+)"):
        m = re.search(pattern, flat)
        if m:
            return [num(v) for v in m.groups()]
    return []


def extract(path, manual):
    text = pdf_text(path)
    flat = re.sub(r"\s+", " ", text)
    dates = report_dates(flat)
    zone = "Asia/Singapore" if "SGT" in flat else "America/New_York"
    parsed = exhibit_b(text.splitlines()) or bill_totals(text)
    entries = {m["date"]: m for m in manual.get(os.path.basename(path), [])}
    if not dates:  # Report without any text: dates and zone come from the manual entries.
        dates = sorted(datetime.date.fromisoformat(d) for d in entries)
        zone = "Asia/Singapore" if dates and dates[0].year < 2026 else zone

    tokens = token_totals(flat)

    sections = []
    for i, date in enumerate(dates):
        entry = entries.get(date.isoformat(), {})
        if "cat" in entry:
            cat = entry["cat"]
            total = sum(cat.values())
        elif i < len(parsed[0]):
            cat, total = parsed[0][i], parsed[1][i]
        else:
            print(f"{os.path.basename(path)}: no data for {date}", file=sys.stderr)
            continue
        if abs(sum(cat.values()) - total) > 1:
            print(f"{os.path.basename(path)} {date}: parts {sum(cat.values())} != total {total}", file=sys.stderr)
        supply = {"total": tokens[i]} if i < len(tokens) else {}
        supply.update(entry.get("supply", {}))
        if "total" not in supply:
            print(f"{os.path.basename(path)}: no token supply for {date}", file=sys.stderr)
        sections.append(
            {
                "date": date.strftime("%B %-d, %Y"),
                "cat": cat,
                "total": total,
                "supply": supply,
                "timestamp": to_utc(date, zone),
            }
        )
    return {"file": path, "sections": sections}


if __name__ == "__main__":
    manual = {}
    for entry in json.load(open(sys.argv[1])):
        manual.setdefault(entry["source"], []).append(entry)
    print(json.dumps([extract(p, manual) for p in sys.argv[2:]]))
