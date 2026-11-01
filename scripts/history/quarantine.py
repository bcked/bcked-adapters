"""Moves records that came from sources bcked may not republish out of the published records.

Usage: python3 quarantine.py <records checkout> <cutover ISO timestamp>

Rows before the cutover (when the crawler switched to Chainlink and on-chain sources) are moved to
quarantine/<kind>/<id>/<file> in the same, private checkout. The API job only reads `records`
folders, so it no longer publishes them. They are kept in case a source gives permission.

Moved: prices of all assets (DefiLlama, DexScreener, Etherscan, Swissquote, BitGo), except the
fixed prices of reserve assets. Supply per chain of the issuer tokens (DefiLlama) and of ETH
(Etherscan). The gold stock from 2019 (World Gold Council). The WBTC custody (wbtc.network).
"""
import csv
import glob
import os
import sys

CHAIN_SUPPLY = [
    "arbitrum:0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "base:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "ethereum:0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
    "ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "ethereum:0xe343167631d89B6Ffc58B88d6b7fB0228795491D",
    "ethereum:ETH",
    "ink:0xe343167631d89B6Ffc58B88d6b7fB0228795491D",
    "polygon:0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    "robinhood:0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
    "solana:2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
    "solana:2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH",
    "solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "solana:Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    "tron:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    "xlayer:0x4ae46a509F6b1D9056937BA4500cb143933D2dc8",
]
WBTC = "ethereum:0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"


def move(records, asset, name, keep):
    """Moves the rows of assets/<asset>/records/<name> for which keep(row) is False."""
    source = os.path.join(records, "assets", asset, "records", name)
    if not os.path.exists(source):
        return 0
    with open(source) as f:
        reader = csv.DictReader(f)
        header, rows = reader.fieldnames, list(reader)
    stay = [row for row in rows if keep(row)]
    moved = [row for row in rows if not keep(row)]
    if not moved:
        return 0
    target = os.path.join(records, "quarantine", "assets", asset, name)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    previous = []
    if os.path.exists(target):
        with open(target) as f:
            previous = list(csv.DictReader(f))
    for path, data in ((source, stay), (target, previous + moved)):
        with open(path, "w", newline="") as f:
            writer = csv.DictWriter(f, header, lineterminator="\n", extrasaction="ignore")
            writer.writeheader()
            writer.writerows(sorted(data, key=lambda row: row["timestamp"]))
    return len(moved)


def main(records, cutover):
    before = lambda row: row["timestamp"] < cutover
    total = 0
    for path in sorted(glob.glob(os.path.join(records, "assets", "*", "records", "price.csv"))):
        asset = path.split(os.sep)[-3]
        if asset.startswith("rwa:") and asset != "rwa:XAU":
            continue  # fixed price of a reserve asset
        total += move(records, asset, "price.csv", lambda row: not before(row))
    for asset in CHAIN_SUPPLY:
        total += move(records, asset, "supply.csv", lambda row: not before(row))
    total += move(records, "rwa:XAU", "supply.csv", lambda row: row["timestamp"] < "2019" or not before(row))
    total += move(records, WBTC, "backing.csv", lambda row: not before(row))
    print(f"{total} rows moved to quarantine/", file=sys.stderr)


if __name__ == "__main__":
    main(*sys.argv[1:3])
