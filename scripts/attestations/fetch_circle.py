"""Downloads the latest USDC attestation reports listed on https://www.circle.com/transparency.

Usage: python3 fetch_circle.py <output dir> [<number of reports>] > reports.txt

Prints the paths of the downloaded reports, newest last, and writes their download URLs to
sources.json in the output dir. Only the newest reports are downloaded (default 4), update.sh only
appends report dates after the latest recorded row.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request

PAGE = "https://www.circle.com/transparency"
HEADERS = {"User-Agent": "Mozilla/5.0"}
MONTHS = "January February March April May June July August September October November December".split()


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=60) as response:
        return response.read()


def month_of(url):
    """(year, month) of a report from its file name, e.g. ".../2026%20USDC_Examination%20Report%20January%2026.pdf"."""
    name = urllib.parse.unquote(url.rsplit("/", 1)[-1])
    year = re.search(r"\b(20\d\d)\b", name)
    month = next((i + 1 for i, m in enumerate(MONTHS) if re.search(rf"\b{m[:3]}", name)), None)
    return (int(year.group(1)), month) if year and month else None


def main(out, count=4):
    os.makedirs(out, exist_ok=True)
    html = get(PAGE).decode("utf-8", "ignore")
    urls = set(re.findall(r"https://[^\"' ]*USDCAttestationReports/[^\"' ]*\.pdf", html))
    dated = sorted((month_of(u), u) for u in urls if month_of(u))
    sources, paths = {}, []
    for _, url in dated[-int(count) :]:
        path = os.path.join(out, urllib.parse.unquote(url.rsplit("/", 1)[-1]).replace(" ", "_"))
        if not os.path.exists(path):
            with open(path, "wb") as f:
                f.write(get(url))
        sources[os.path.basename(path)] = url
        paths.append(path)
    with open(os.path.join(out, "sources.json"), "w") as f:
        json.dump(sources, f, indent=1)
    print("\n".join(paths))


if __name__ == "__main__":
    main(*sys.argv[1:3])
