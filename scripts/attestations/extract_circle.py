"""Extracts the USDC reserves of Circle from its monthly attestation reports (Grant Thornton, Deloitte).

Usage: python3 extract_circle.py circle_manual.json <report.pdf>... > circle.json

Scanned reports without text layer were read manually and are kept in circle_manual.json.

Prints JSON in the same format as the other extract_* scripts. Report dates are at 11:59 PM Pacific time.

- 2018 to 2020: US dollars held in custody accounts (rwa:USD).
- 2021 and 2022: only the total of a mix of cash and short-dated U.S. government obligations
  (2021 also commercial paper and bonds), recorded as rwa:undefined. The total equals the USDC in
  circulation, which is read from the auditor's letter because the reserve page of the 2022 reports
  uses a broken font encoding.
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


def grant_thornton(flat):
    date = re.search(rf"as of ({DATE}) at 11:59 ?PM", flat, re.I)
    if not date:
        return []
    cash = re.search(r"US Dollars held in custody accounts = \$([\d,]+)", flat)
    # March and April 2021: custody accounts are at least equal to the tokens outstanding.
    outstanding = re.search(r"less blacklisted tokens = ([\d,]+) USDC", flat)
    if cash or outstanding:
        key, value = "rwa:USD", num((cash or outstanding).group(1))
    else:
        circulation = re.search(r"in Circulation\s?\d? = ([\d,]+) USDC", flat)
        if not circulation:
            return []
        key, value = "rwa:undefined", num(circulation.group(1))
    return [{"date": date.group(1), "timestamp": to_utc(date.group(1)), "cat": {key: value}, "total": value}]


def extract(path, manual):
    text = pdf_text(path)
    sections = deloitte(text.splitlines()) or grant_thornton(re.sub(r"\s+", " ", text))
    name = path.rsplit("/", 1)[-1]
    if not sections and name in manual:
        entry = manual[name]
        sections = [{"date": entry["date"], "timestamp": to_utc(entry["date"]), "cat": entry["cat"], "note": entry["note"]}]
    return {"file": path, "sections": sections}


if __name__ == "__main__":
    manual = {m["source"]: m for m in json.load(open(sys.argv[1]))}
    print(json.dumps([extract(p, manual) for p in sys.argv[2:]]))
