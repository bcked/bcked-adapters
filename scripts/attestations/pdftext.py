"""Text extraction from attestation PDFs, shared by the extract_* scripts. Requires pdftotext (poppler)."""
import re
import subprocess


def pdf_text(path):
    text = subprocess.run(["pdftotext", "-layout", path, "-"], capture_output=True, text=True, timeout=60).stdout
    # Some reports contain invisible directional formatting characters, sometimes inside words ("T otal").
    text = re.sub(r"[‎‏‪-‮]", "", text)
    return re.sub(r"\bT (otal)", r"T\1", text)


# Chain names in the reports, as named in the token's supply records where they differ.
CHAIN_NAMES = {"Robinhood": "Robinhood Chain", "Arbitrum One": "Arbitrum", "X-Layer": "X Layer"}


def chain_supply(text, count):
    """Paxos tokens outstanding per chain at each report date, from Exhibit A (USDG, PYUSD).

    The columns follow the order of the footnotes that name each chain's contract. Some reports have
    one table with both dates per chain, others one table per date. Returns per date the tokens per
    chain and the "total", or [] if the table is missing or the chains do not add up to the total.
    """
    flat = re.sub(r"\s+", " ", text)
    chains = list(dict.fromkeys(re.findall(r"Blockchain ([A-Za-z -]+?) refers to the smart contract", flat)))
    k = len(chains) + 1
    # Row d. Its numbers follow "redeemable tokens", "d." or "outstanding", depending on the layout. The
    # summary on the first pages has the two totals in such a row too, so rows of other lengths are skipped.
    # "-" is an empty cell (no tokens on that chain yet).
    pattern = r"redeemable tokens (?:d\. )?(?:outstanding )?((?:(?:[\d,]+|-) )+)|d\.? Total [A-Z]+ ((?:(?:[\d,]+|-) )+)\.? ?redeemable tokens"
    rows = [
        [0.0 if v == "-" else float(v.replace(",", "")) for v in "".join(m).split()]
        for m in re.findall(pattern, flat)
    ]
    rows = [r for r in rows if len(r) in (k, k * count)]
    if len(rows) == 1 and len(rows[0]) == k * count:  # one table, both dates per chain
        per_date = [rows[0][i::count] for i in range(count)]
    elif len(rows) == count and all(len(r) == k for r in rows):  # one table per date
        per_date = rows
    else:
        return []
    result = []
    for values in per_date:
        if abs(sum(values[:-1]) - values[-1]) > 1:
            return []
        result.append({**{CHAIN_NAMES.get(c, c): v for c, v in zip(chains, values)}, "total": values[-1]})
    return result
