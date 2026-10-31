"""Extracts the BUSD reserve composition per report date from Paxos attestation PDFs.

Prints JSON: one entry per report with its sections (report date, assets by category, reported total).
"""
import datetime
import json
import re
import sys
from zoneinfo import ZoneInfo

from pdftext import pdf_text

MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December"
DATE = rf"(?:{MONTHS}) \d{{1,2}},? 20\d\d"
AMOUNT = r"\$?\s?([\d,]{3,}(?:\.\d+)?)"


def num(s):
    return float(s.replace(",", "").replace("$", ""))


def to_utc(date):
    d = datetime.datetime.strptime(re.sub(r",", "", date), "%B %d %Y")
    local = datetime.datetime(d.year, d.month, d.day, 17, tzinfo=ZoneInfo("America/New_York"))
    return local.astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def add(cat, key, value):
    cat[key] = round(cat.get(key, 0) + value, 2)


def holdings_tables(lines):
    """2022-2024 layout: a holdings table per report date, ending with the total of all assets."""
    sections = []
    current = None
    kind = None
    for line in lines:
        s = re.sub(r"\s+", " ", line).strip()
        # Headers can be prefixed by a bullet character.
        head = re.fullmatch(rf"(?:[^\w$]*|x\s+)({DATE}) at 5:00 ?pm ET:", s, re.I)
        if head:
            current = {"date": head.group(1), "cat": {}, "subtotals": {}}
            kind = None
            continue
        if current is None:
            continue
        # Treasuries listed as collateral of reverse repurchase agreements are repos, not holdings.
        if re.search(r"(?i)Collateral Held Pursuant|Held Pursuant to Overnight", s):
            kind = "repo"
        amount = re.search(AMOUNT + r"\s*$", s)
        if not amount:
            continue
        value = num(amount.group(1))
        cusip = re.search(r"\b(9127[0-9A-Z]{5}|9128[0-9A-Z]{5})\b", s)
        if cusip:
            # A holding without description continues the description of the line above.
            if kind != "repo" and re.match(r"(?i)U\.?S\.? Treasury Bills?", s):
                kind = "bills"
            elif kind != "repo" and re.match(r"(?i)U\.?S\.? Treasury", s):
                kind = "debt"
            # Paxos holds Treasury bills directly. Notes and bonds are only listed as the collateral of
            # overnight reverse repurchase agreements, so they count as repos.
            if kind == "bills":
                add(current["cat"], "rwa:USTB", value)
            elif kind in ("debt", "repo"):
                add(current["cat"], "rwa:USTrepo", value)
        elif re.search(r"(?i)^Total U\.?S\.? Government Guaranteed Debt Instruments Held Pursuant", s):
            current["subtotals"]["rwa:USTrepo"] = value
            kind = None
        elif re.search(r"(?i)Total U\.?S\.? Treasury Bills", s):
            current["subtotals"]["rwa:USTB"] = value
        elif re.search(r"(?i)Government Guaranteed Debt|Reverse Repurchase Agreements:|Reserve Repurchase Agreements:", s):
            current["subtotals"]["debt"] = value
        elif re.search(r"(?i)Total U\.?S\.? Dollars Held", s):
            add(current["cat"], "rwa:USD", value)
            current["subtotals"]["rwa:USD"] = value
        elif re.search(r"(?i)Total Assets Held in Reserve Accounts|Total Fair Value of Redemption Assets", s):
            current["total"] = value
            if current["cat"]:
                sections.append(current)
            current = None
    return sections


def exhibit_b(lines):
    """2025+ layout: Exhibit B with one column per report date."""
    start = next((i for i, l in enumerate(lines) if "Exhibit B: Composition" in l), None)
    if start is None:
        return []
    dates = None
    rows = {}
    mapping = [
        ("rwa:USD", r"^Cash\b"),
        ("rwa:MMF", r"^Government money market funds"),
        ("rwa:USTrepo", r"^Repurchase agreements"),
        # Not split by maturity in this layout. Recorded as T-bills, the usual reserve holding.
        ("rwa:USTB", r"^Obligations of U\.?S\.? Treasury"),
        ("total", r"^Total\b"),
    ]
    for line in lines[start + 1 : start + 40]:
        s = re.sub(r"\s+", " ", line).strip()
        found = re.findall(DATE, s)
        if dates is None and found:
            dates = found
            continue
        if dates is None:
            continue
        values = [0.0 if v == "-" else num(v) for v in re.findall(r"\$[\d,]+(?:\.\d+)?|(?<=\s)-(?=\s|$)", " " + s + " ")]
        values = [v if isinstance(v, float) else v for v in values]
        for key, pattern in mapping:
            if re.search(pattern, s, re.I) and key not in rows and len(values) == len(dates):
                rows[key] = values
        if "total" in rows:
            break
    if not dates or "total" not in rows:
        return []
    sections = []
    for j, date in enumerate(dates):
        cat = {k: v[j] for k, v in rows.items() if k not in ("total",) and v[j]}
        sections.append({"date": date, "cat": cat, "total": rows["total"][j]})
    return sections


def reserve_total(flat):
    """2019-2022 layout: only the total reserve funds are reported."""
    m = re.search(r"(?:Reserve Accounts|Reserve Funds) (?:is|are) at least equal to or greater than \$([\d,]+(?:\.\d+)?)", flat)
    date = re.search(rf"as of ({DATE})", flat, re.I)
    if not m or not date:
        return []
    # Only bank deposits are described as reserves: cash. Otherwise the composition is unknown.
    mixed = re.search(r"(?i)debt instruments|PAX(?:\)|”)? tokens|Treasury", flat[: m.end()])
    key = "rwa:undefined" if mixed else "rwa:USD"
    value = num(m.group(1))
    return [{"date": date.group(1), "cat": {key: value}, "total": value}]


def extract(path):
    text = pdf_text(path)
    lines = text.splitlines()
    flat = re.sub(r"\s+", " ", text)
    sections = exhibit_b(lines) or holdings_tables(lines) or reserve_total(flat)
    for s in sections:
        s["date"] = re.sub(r"\s+", " ", s["date"])
        s["timestamp"] = to_utc(s["date"])
    return {"file": path, "sections": sections}


if __name__ == "__main__":
    print(json.dumps([extract(p) for p in sys.argv[1:]]))
