"""Extracts the gold reserves of Tether Gold (XAUt) from its attestation reports.

Usage: python3 extract_xaut.py <reports.json> > xaut.json

<reports.json> is written by fetch_xaut.py. Each report states the fine troy ounces of gold the
custodian holds for the token holders (rwa:XAU) and the tokens in circulation, which is the total
the ounces are checked against. Reports are as of 11:59 PM UTC.
Prints JSON in the same format as the other extract_* scripts.
"""
import datetime
import json
import re
import sys

from pdftext import pdf_text


def number(text):
    return float(text.replace(",", ""))


def extract(path):
    flat = re.sub(r"\s+", " ", pdf_text(path))
    date = re.search(r"as of (\d{1,2} \w+ \d{4}) at 11:59 ?PM UTC", flat)
    ounces = re.search(r"Gold Reserves containing a total of ([\d,]+(?:\.\d+)?) fine troy ounces", flat)
    tokens = re.search(r"tokens in circulation are ([\d,]+(?:\.\d+)?) XAU", flat)
    if not (date and ounces and tokens):
        return {"file": path, "sections": []}
    day = datetime.datetime.strptime(date.group(1), "%d %B %Y")
    return {
        "file": path,
        "sections": [
            {
                "date": day.strftime("%B %d, %Y"),
                "timestamp": day.strftime("%Y-%m-%dT23:59:00.000Z"),
                "cat": {"rwa:XAU": number(ounces.group(1))},
                "total": number(tokens.group(1)),
            }
        ],
    }


if __name__ == "__main__":
    print(json.dumps([extract(r["file"]) for r in json.load(open(sys.argv[1]))]))
