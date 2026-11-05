"""Extracts the EURC reserves of Circle from its monthly attestation reports.

Usage: python3 extract_eurc.py <report.pdf>... > eurc.json

Prints JSON in the same format as the other extract_* scripts. The reserves are euro cash held at
regulated financial institutions, recorded as rwa:EUR. Each section has the EURC in circulation as
"supply" (token total for the chain shares).

- 2022-06 to 2022-12 (Grant Thornton, as "EUROC"): one report date at 11:59 PM Pacific time, with the
  EUROC in circulation and the euro assets held in custody accounts. The June 2022 report only states
  that the assets are at least equal to the 2,186 EUROC in circulation, so the reserve is recorded
  as that amount.
- From 2023: two report dates per report, with the EURC in circulation and the fair value of the
  assets held in the EURC reserve. 11:59 PM Pacific time until 2024-08, 11:59 PM UTC from 2024-09.
  Each date is checked against the total reserve assets where the report lists them.
"""
import datetime
import json
import re
import sys
from zoneinfo import ZoneInfo

from pdftext import pdf_text

MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December"
DATE = rf"(?:{MONTHS}) \d{{1,2}},? 20\d\d"
NUMBER = r"(\d{1,3}(?:,\d{3})+|\d{1,3})"


def num(s):
    return float(s.replace(",", ""))


def parse_date(date):
    return datetime.datetime.strptime(re.sub(r",", "", date).title(), "%B %d %Y")


def to_utc(date, zone):
    d = parse_date(date)
    local = datetime.datetime(d.year, d.month, d.day, 23, 59, tzinfo=ZoneInfo(zone))
    return local.astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def section(date, zone, reserve, circulation):
    return {
        "date": parse_date(date).strftime("%B %-d, %Y"),
        "timestamp": to_utc(date, zone),
        "cat": {"rwa:EUR": reserve},
        "total": reserve,
        "supply": {"total": circulation},
    }


def two_dates(flat, zone):
    """Reports from 2023: a table with two report dates."""
    dates = re.search(rf"Report Dates ({DATE}) ({DATE})", flat)
    circulation = re.search(rf"EURO?C in Circulation (?:\(as defined in the criteria )?{NUMBER} {NUMBER}", flat)
    reserves = re.search(rf"Fair Value of Assets Held in EURO?C Reserve € ?{NUMBER} € ?{NUMBER}", flat)
    if not (dates and circulation and reserves):
        return []
    sections = []
    for i in (1, 2):
        date, reserve = dates.group(i), num(reserves.group(i))
        # The total of the reserve assets per date, where the report lists it (not readable in all).
        totals = re.findall(rf"TOTAL EURO?C RESERVE ASSETS AS OF ({DATE}) € ?{NUMBER}", flat, re.I)
        for total_date, total in totals:
            if parse_date(total_date) == parse_date(date) and num(total) != reserve:
                raise ValueError(f"{date}: reserve {reserve:,.0f} differs from the total {num(total):,.0f}")
        sections.append(section(date, zone, reserve, num(circulation.group(i))))
    return sections


def one_date(flat, zone):
    """Reports of 2022: one report date."""
    date = re.search(rf"as of ({DATE}) at 11:59 PM", flat)
    circulation = re.search(rf"in Circulation1? = {NUMBER} EUROC", flat)
    if not (date and circulation):
        return []
    reserve = re.search(rf"held in custody accounts = € ?{NUMBER}", flat)
    value = num(circulation.group(1))
    return [section(date.group(1), zone, num(reserve.group(1)) if reserve else value, value)]


def extract(path):
    flat = re.sub(r"\s+", " ", pdf_text(path).replace("ﬁ", "fi"))
    zone = "UTC" if "11:59pm Coordinated Universal Time" in flat.replace("11:59 pm", "11:59pm") else "America/Los_Angeles"
    return {"file": path, "sections": two_dates(flat, zone) or one_date(flat, zone)}


if __name__ == "__main__":
    print(json.dumps([extract(p) for p in sys.argv[1:]]))
