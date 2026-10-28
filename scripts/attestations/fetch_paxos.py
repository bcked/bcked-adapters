"""Downloads all attestation reports of a Paxos product.

Usage: python3 fetch_paxos.py <transparency page url> <product pattern> <output dir>
Example: python3 fetch_paxos.py https://www.paxos.com/paxg-transparency "PAX Gold|PAXG" /tmp/paxg

The Paxos website is built with Framer. The report PDFs are not linked in the HTML but referenced
in the page's JavaScript modules, which also contain reports of other products. All referenced PDFs
are downloaded, and those whose text matches the product pattern are kept and printed.
"""
import os
import re
import subprocess
import sys
import urllib.request

HEADERS = {"User-Agent": "Mozilla/5.0"}


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=60) as response:
        return response.read()


def main(page, product, out):
    os.makedirs(out, exist_ok=True)
    html = get(page).decode("utf-8", "ignore")
    modules = sorted(set(re.findall(r"https://framerusercontent\.com/sites/[^\"']+\.mjs", html)))
    pdfs = set()
    for module in modules:
        code = get(module).decode("utf-8", "ignore")
        pdfs.update(re.findall(r"https://framerusercontent\.com/assets/[A-Za-z0-9]+\.pdf", code))
    kept = []
    for url in sorted(pdfs):
        path = os.path.join(out, os.path.basename(url))
        if not os.path.exists(path):
            with open(path, "wb") as f:
                f.write(get(url))
        text = subprocess.run(["pdftotext", path, "-"], capture_output=True, text=True, timeout=60).stdout
        if re.search(product, text):
            kept.append(path)
        else:
            os.remove(path)
    print("\n".join(kept))
    print(f"{len(kept)} of {len(pdfs)} referenced reports match {product!r}", file=sys.stderr)


if __name__ == "__main__":
    main(*sys.argv[1:4])
