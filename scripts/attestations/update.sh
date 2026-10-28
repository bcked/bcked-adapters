#!/usr/bin/env bash
# Adds new attestation reports of Paxos (PAXG, BUSD) and Tether (USDT) to the records.
#
# Usage: scripts/attestations/update.sh <records checkout>
#
# Downloads the reports, checks every report date after the latest recorded row (check_new.py) and
# appends those rows with the report as evidence (write_backing.py --append). Fails without writing
# if a new report does not add up. Circle is not included, its reserves are crawled daily.
set -euo pipefail

records=$(realpath "$1")
here=$(dirname "$(realpath "$0")")
work=$(mktemp -d)
cd "$here"

paxos() { # <name> <transparency page> <product pattern> <asset id> <evidence prefix>
    local dir="$records/assets/$4/records"
    python3 fetch_paxos.py "$2" "$3" "$work/$1" > "$work/$1.txt"
    # shellcheck disable=SC2046
    python3 extract_"$1".py $(cat "$work/$1.txt") > "$work/$1.json"
    python3 check_new.py "$work/$1.json" "$dir/backing.csv"
    python3 write_backing.py "$work/$1.json" "$dir" "$5" --append
}

paxos paxg https://www.paxos.com/paxg-transparency "PAX Gold|PAXG" \
    "ethereum:0x45804880De22913dAFE09f4980848ECE6EcbAf78" PAXG
paxos busd https://www.paxos.com/busd-transparency "Binance USD|BUSD" \
    "ethereum:0x4Fabb145d64652a948d72533023f6E7A623C7C53" BUSD

tether="$records/entities/tether/records"
python3 fetch_tether.py "$work/tether" > "$work/tether-reports.json"
python3 extract_tether.py "$work/tether-reports.json" tether_manual.json > "$work/tether.json"
python3 check_new.py "$work/tether.json" "$tether/backing.csv"
python3 convert_prices.py "$work/tether.json" > "$work/tether-units.json"
python3 write_backing.py "$work/tether-units.json" "$tether" USDT --append
