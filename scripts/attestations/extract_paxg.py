"""Extracts the gold backing of PAXG from Paxos attestation PDFs.

Usage: python3 extract_paxg.py <report.pdf>... > paxg.json

Prints JSON in the same format as extract_busd.py: one entry per report with its sections
(report date, fine troy ounces of gold as rwa:XAU, PAXG tokens as total).
"""
import datetime
import json
import re
import sys
from zoneinfo import ZoneInfo

from pdftext import pdf_text

MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December"
NUMBER = r"([\d,]+(?:\.\d+)?)"


def num(s):
    return float(s.replace(",", ""))


def to_utc(date):
    """Reports are as of 5:00 PM New York time."""
    local = datetime.datetime(date.year, date.month, date.day, 17, tzinfo=ZoneInfo("America/New_York"))
    return local.astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def extract(path):
    text = pdf_text(path)
    flat = re.sub(r"\s+", " ", text)
    date = re.search(rf"as of ({MONTHS}) (\d{{1,2}}),? (20\d\d)", flat, re.I) or re.search(
        rf"({MONTHS}) (\d{{1,2}}), (20\d\d)", flat
    )
    if not date:
        return {"file": path, "sections": []}
    day = datetime.datetime.strptime(f"{date.group(1)} {date.group(2)} {date.group(3)}", "%B %d %Y")
    # Withum reports (until 2025-01) and KPMG reports (from 2025-02) state the gold differently.
    ounces = re.search(rf"held in custody is at least {NUMBER} ounces", flat) or re.search(
        rf"Total redemption assets in fine troy ounces of gold(?: \(Exhibit B\))? {NUMBER}", flat
    )
    tokens = re.search(
        rf"(?:PAX Gold tokens issued|Total PAXG redeemable tokens outstanding)[^\d]{{0,60}}?{NUMBER}", flat
    )
    if not ounces:
        return {"file": path, "sections": []}
    section = {
        "date": day.strftime("%B %d, %Y"),
        "timestamp": to_utc(day),
        "cat": {"rwa:XAU": num(ounces.group(1))},
    }
    if tokens:
        section["total"] = num(tokens.group(1))
    return {"file": path, "sections": [section]}


if __name__ == "__main__":
    print(json.dumps([extract(p) for p in sys.argv[1:]]))
