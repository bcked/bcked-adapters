"""Downloads the Tether Gold (XAUt) attestation reports listed on https://gold.tether.to/reports.

Usage: python3 fetch_xaut.py <output dir> > reports.json

The report list is part of the site's JavaScript bundle ({date, href} entries). Prints a list of
{"date", "file"} for every report and writes the download URLs to sources.json in the output dir.
"""
import json
import os
import re
import sys
import urllib.request

SITE = "https://gold.tether.to"
HEADERS = {"User-Agent": "Mozilla/5.0"}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=60) as response:
        return response.read()


def main(out):
    os.makedirs(out, exist_ok=True)
    html = get(SITE + "/").decode("utf-8", "ignore")
    bundle = re.search(r'src="(/assets/index-[^"]+\.js)"', html).group(1)
    js = get(SITE + bundle).decode("utf-8", "ignore")
    items = re.findall(r'\{date:"(\d{4}-\d{2}-\d{2})",href:"(/docs/reports/attestations/[^"]+\.pdf)"\}', js)
    if not items:
        sys.exit("No reports found in the gold.tether.to bundle, the layout changed")
    reports, sources = [], {}
    for date, href in sorted(set(items)):
        url = SITE + href
        path = os.path.join(out, os.path.basename(href))
        if not os.path.exists(path):
            with open(path, "wb") as f:
                f.write(get(url))
        reports.append({"date": date, "file": path})
        sources[os.path.basename(path)] = url
    with open(os.path.join(out, "sources.json"), "w") as f:
        json.dump(sources, f, indent=1)
    print(json.dumps(reports, indent=2))


if __name__ == "__main__":
    main(sys.argv[1])
