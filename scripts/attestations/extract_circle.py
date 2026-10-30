"""Extracts the USDC reserves of Circle from its monthly attestation reports (Grant Thornton, Deloitte).

Usage: python3 extract_circle.py circle_manual.json <report.pdf>... > circle.json

Scanned reports without text layer were read manually and are kept in circle_manual.json.

Prints JSON in the same format as the other extract_* scripts. Report dates are at 11:59 PM Pacific time.

- 2018 to 2020: US dollars held in custody accounts (rwa:USD).
- 2021-05 to 2021-10: a breakdown table in $bn. Cash and cash equivalents are rwa:USD, Yankee CDs and
  commercial paper rwa:CP, corporate bonds rwa:CORPBOND. US Treasuries (maturity up to 3 years) are
  recorded as rwa:USTB, the table does not split them. Municipal and agency bonds (at most $0.2bn)
  are rwa:undefined. The values are scaled to the USDC in circulation.
- 2021-11 to 2022-06: only the total of a mix of cash and short-dated U.S. government obligations,
  recorded as rwa:undefined. The total equals the USDC in circulation, which is read from the
  auditor's letter because the reserve page of some reports uses a broken font encoding.
- 2022-07 to 2022-12: treasuries listed by CUSIP and cash deposits, split like the Deloitte reports.
- From 2023: Deloitte reports with two report dates each. Treasury securities are split by CUSIP into
  bills, notes and bonds. The rest of the Circle Reserve Fund is cash and repurchase agreements,
  other reserve assets are cash. Each date is checked against the total reserve assets.
"""
import datetime
import json
import re
import sys
from zoneinfo import ZoneInfo

from pdftext import pdf_text

MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December"
DATE = rf"(?:{MONTHS}) \d{{1,2}},? 20\d\d"
AMOUNT = r"\(?\$?\s?(\d{1,3}(?:,\d{3})+)\)?"


def num(s):
    """Amounts in parentheses are negative."""
    value = float(re.sub(r"[^\d.]", "", s))
    return -value if s.strip().startswith("(") else value


def to_utc(date):
    d = datetime.datetime.strptime(re.sub(r",", "", date).title(), "%B %d %Y")
    local = datetime.datetime(d.year, d.month, d.day, 23, 59, tzinfo=ZoneInfo("America/Los_Angeles"))
    return local.astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def last_amount(line):
    found = re.findall(AMOUNT, line)
    if not found:
        return None
    raw = re.findall(r"\(?\$?\s?\d{1,3}(?:,\d{3})+\)?", line)[-1]
    return num(raw)


def deloitte(lines):
    """Sections end with "TOTAL USDC RESERVE ASSETS AS OF <date>"."""
    sections = []
    block = []
    for line in lines:
        block.append(line)
        end = re.search(rf"TOTAL USDC RESERVE ASSETS AS OF ({DATE})", line, re.I)
        if not end:
            continue
        cat, totals, fund_cash = {}, {"treasury": 0.0}, 0.0
        # The fund block lists treasuries, repurchase agreements and cash. The block of other reserve
        # assets lists cash and, from 2026-07, treasuries too.
        part, other_treasury = "fund", 0.0
        for l in block:
            s = re.sub(r"\s+", " ", l).strip()
            value = last_amount(s)
            cusip = re.search(r"\b(9127[0-9A-Z]{5}|9128[0-9A-Z]{5})\b", s)
            if re.search(r"TOTAL U\.?S\.? TREASURY SECURITIES", s, re.I):
                totals["treasury"] += value
                if part == "fund":
                    totals["fund_treasury"] = value
                else:
                    other_treasury += value
            elif re.search(r"TOTAL CIRCLE RESERVE FUND ASSETS", s, re.I):
                totals["fund"] = value
                part = "other"
            elif re.search(r"TOTAL OTHER USDC RESERVE ASSETS", s, re.I):
                totals["other"] = value
            elif re.search(r"TOTAL USDC RESERVE ASSETS", s, re.I):
                totals["total"] = value
            elif cusip and value is not None:
                key = (
                    "rwa:USTB"
                    if cusip.group(1).startswith(("912796", "912797"))
                    else "rwa:USTBOND" if cusip.group(1).startswith("912810") else "rwa:USTNOTE"
                )
                cat[key] = cat.get(key, 0) + value
            elif part == "fund" and "fund_treasury" in totals and value is not None and re.search(r"(?i)cash", s):
                fund_cash += value
        block = []
        if not all(k in totals for k in ("fund_treasury", "fund", "other", "total")):
            continue
        cat["rwa:USD"] = fund_cash + totals["other"] - other_treasury
        # The remainder of the fund are repurchase agreements, whose label is not always on the amount's line.
        cat["rwa:USTrepo"] = totals["fund"] - totals["fund_treasury"] - fund_cash
        cat = {k: round(v, 2) for k, v in cat.items() if round(v, 2)}
        sections.append(
            {
                "date": end.group(1).title(),
                "timestamp": to_utc(end.group(1)),
                "cat": cat,
                "total": totals["total"],
                "subtotals": {"treasury": totals["treasury"]},
            }
        )
    return sections


TABLE_2021 = [
    (r"(?i)^cash", "rwa:USD"),
    (r"(?i)^yankee cds", "rwa:CP"),
    (r"(?i)^commercial paper", "rwa:CP"),
    (r"(?i)^us treasuries", "rwa:USTB"),
    (r"(?i)^corporate bonds", "rwa:CORPBOND"),
    (r"(?i)^municipal", "rwa:undefined"),
]


def breakdown_2021(lines, total):
    """2021-05 to 2021-10: the "USDC Reserve Breakdown" table in $bn, scaled to the total."""
    starts = [i for i, l in enumerate(lines) if "Reserve Breakdown" in l]
    if not starts:
        return None
    parts = {}
    for line in lines[starts[-1] + 1 : starts[-1] + 30]:
        s = re.sub(r"\s+", " ", line).strip()
        if re.match(r"(?i)^total\b(?! allocation)", s):
            break
        row = re.match(r"^(.*?[A-Za-z])\s(?:\d\s)?(-|[\d.]+) [\d.]+%$", s)
        if not row:
            continue
        key = next((k for pattern, k in TABLE_2021 if re.search(pattern, row.group(1))), None)
        if key is None:
            return None  # An unknown row: better unsplit than wrong.
        value = 0.0 if row.group(2) == "-" else float(row.group(2))
        parts[key] = parts.get(key, 0) + value
    sum_bn = sum(parts.values())
    if not sum_bn:
        return None
    return {k: round(v / sum_bn * total, 2) for k, v in parts.items() if v}


def cusip_listing(lines):
    """2022-07 to 2022-12: treasuries by CUSIP and cash, checked against the total reserve assets."""
    cat, total = {}, None
    for line in lines:
        s = re.sub(r"\s+", " ", line).strip()
        value = last_amount(s)
        if value is None:
            continue
        cusip = re.search(r"\b(912[0-9A-Z]{6})\b", s)
        if re.match(r"(?i)^TOTAL USDC RESERVE ASSETS\b", s):
            total = value
        elif re.match(r"(?i)^TOTAL", s):
            continue
        elif cusip:
            key = (
                "rwa:USTB"
                if cusip.group(1).startswith(("912796", "912797"))
                else "rwa:USTBOND" if cusip.group(1).startswith("912810") else "rwa:USTNOTE"
            )
            cat[key] = cat.get(key, 0) + value
        elif re.search(r"(?i)\bcash\b", s):
            cat["rwa:USD"] = cat.get("rwa:USD", 0) + value
    if total is None or not cat or abs(sum(cat.values()) - total) > 1000:
        return None
    return {k: round(v, 2) for k, v in cat.items() if round(v, 2)}, total


def grant_thornton(flat, lines):
    date = re.search(rf"as of ({DATE}) at 11:59 ?PM", flat, re.I)
    if not date:
        return []
    section = lambda cat, total: [
        {"date": date.group(1), "timestamp": to_utc(date.group(1)), "cat": cat, "total": total}
    ]
    # 2022-07 to 2022-12 list every treasury. These reports also state the tokens outstanding, which
    # would otherwise be read as cash below.
    listing = cusip_listing(lines)
    if listing:
        return section(*listing)
    cash = re.search(r"US Dollars held in custody accounts = \$([\d,]+)", flat)
    # March and April 2021: custody accounts are at least equal to the tokens outstanding.
    outstanding = re.search(r"less blacklisted tokens = ([\d,]+) USDC", flat)
    if cash or outstanding:
        value = num((cash or outstanding).group(1))
        return section({"rwa:USD": value}, value)
    circulation = re.search(r"in Circulation\s?\d? = ([\d,]+) USDC", flat)
    if not circulation:
        return []
    value = num(circulation.group(1))
    return section(breakdown_2021(lines, value) or {"rwa:undefined": value}, value)


def extract(path, manual):
    text = pdf_text(path)
    sections = deloitte(text.splitlines()) or grant_thornton(re.sub(r"\s+", " ", text), text.splitlines())
    name = path.rsplit("/", 1)[-1]
    if not sections and name in manual:
        entry = manual[name]
        sections = [{"date": entry["date"], "timestamp": to_utc(entry["date"]), "cat": entry["cat"], "note": entry["note"]}]
    return {"file": path, "sections": sections}


if __name__ == "__main__":
    manual = {m["source"]: m for m in json.load(open(sys.argv[1]))}
    print(json.dumps([extract(p, manual) for p in sys.argv[2:]]))
