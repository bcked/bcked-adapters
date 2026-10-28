"""Extracts Tether's reserve composition from its assurance reports (BDO, MHA Cayman).

Usage: python3 extract_tether.py <reports.json> tether_manual.json > tether.json

<reports.json> is a list of {"date": "June 30, 2026", "file": "<pdf>"} as written by fetch_tether.py.
The early bank confirmations (2017, 2018) have no machine readable table, one is a scan. Their values
were read manually and are kept in tether_manual.json with their source.
Prints JSON in the same format as the other extract_* scripts, with the reserve categories in USD.
Precious metals and Bitcoin are kept in USD here (keys "usd:XAU" and "usd:BTC"); convert_prices.py
turns them into ounces and BTC.
"""
import datetime
import json
import re
import sys

from pdftext import pdf_text

AMOUNT = re.compile(r"\$?\s?(\d{1,3}(?:,\d{3}){2,}(?:\.\d+)?)")


def category(label):
    """Maps a reserve category of the report to an underlying asset."""
    l = label.lower()
    if "precious metals" in l and not re.search(r"bonds|funds", l):
        return "usd:XAU"
    if "bitcoin" in l:
        return "usd:BTC"
    if "treasury bills" in l and "non-u" not in l and "non u" not in l:
        return "rwa:USTB"
    if "reverse repurchase" in l or "reverse repo" in l:
        return "rwa:USTrepo"
    if re.search(r"cash (&|and) bank deposits|^cash$|fiduciary deposits", l):
        return "rwa:USD"
    # Commercial paper, money market funds, non-U.S. bills, bonds, equities, loans, other investments.
    return "rwa:undefined"


def clean(label):
    label = re.sub(r"^\s*\d\.\s*", "", label)  # "2. Corporate Bonds"
    label = re.sub(r"(?<=[A-Za-z)])\s?\d{1,2}$", "", label.strip())  # footnote markers
    return re.sub(r"\s+", " ", label).strip()


def extract(path, date):
    lines = pdf_text(path).splitlines()
    start = next(
        (
            i
            for i, l in enumerate(lines)
            if re.search(r"(?i)(U\.S\. )?Treasury Bills|Commercial Paper|Cash (&|and) Bank Deposits", l)
            and AMOUNT.search(l)
        ),
        None,
    )
    if start is None:
        return {"file": path, "date": date, "sections": [], "items": []}
    items, total, pending = [], None, None
    for line in lines[start:]:
        text = line.strip()
        if not text:
            continue
        amount = AMOUNT.search(text)
        label = clean(AMOUNT.sub("", text)) if amount else clean(text)
        if re.match(r"(?i)total\b", label):
            total = float(amount.group(1).replace(",", "")) if amount else None
            break
        if re.match(r"(?i)subtotal", label):
            continue
        if amount:
            name = label if re.search(r"[A-Za-z]{3}", label) else pending
            items.append((name, float(amount.group(1).replace(",", ""))))
            pending = None
        elif re.search(r"[A-Za-z]{3}", label):
            # A label without amount: either the start of a wrapped row or the end of the previous one.
            pending = label if pending is None or not items or items[-1][0] != pending else pending
            if items and re.fullmatch(r"(?i)agreements|deposit|deposits", label):
                pending = None
    cat = {}
    for name, value in items:
        key = category(name or "")
        cat[key] = round(cat.get(key, 0) + value, 2)
    day = datetime.datetime.strptime(date, "%B %d, %Y")
    section = {
        "date": date,
        # Reserves are reported as of the end of the day (UTC).
        "timestamp": day.strftime("%Y-%m-%dT23:59:59.000Z"),
        "cat": cat,
    }
    if total is not None:
        section["total"] = total
    return {"file": path, "date": date, "sections": [section], "items": items}


def total_only(path, date):
    """Feb and Mar 2021: only the consolidated total assets are reported."""
    flat = re.sub(r"\s+", " ", pdf_text(path))
    m = re.search(r"Consolidated total assets amount to at least (?:USD|US\$) ?([\d,]+)", flat)
    if not m:
        return None
    value = float(m.group(1).replace(",", ""))
    day = datetime.datetime.strptime(date, "%B %d, %Y")
    return {
        "date": date,
        "timestamp": day.strftime("%Y-%m-%dT23:59:59.000Z"),
        "cat": {"rwa:undefined": value},
        "total": value,
    }


def main(reports_path, manual_path):
    """Extracts all reports. Reports without a readable table use the manually read values."""
    manual = {m["source"]: m for m in json.load(open(manual_path))}
    out = []
    for report in json.load(open(reports_path)):
        result = extract(report["file"], report["date"])
        if not result["sections"]:
            section = total_only(report["file"], report["date"])
            name = report["file"].rsplit("/", 1)[-1]
            if section is None and name in manual:
                entry = manual[name]
                section = {k: entry[k] for k in ("date", "timestamp", "cat")} | {"note": entry["note"]}
            result["sections"] = [section] if section else []
        out.append(result)
    print(json.dumps(out))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
