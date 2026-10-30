#!/usr/bin/env bash
# Adds new attestation reports of Paxos (PAXG, BUSD), Tether (USDT, XAUt) and Circle (USDC) to the records.
#
# Usage: scripts/attestations/update.sh <records checkout> [<evidence checkout>]
#
# Downloads the reports, checks every report date after the latest recorded row (check_new.py) and
# appends those rows, listing each report in evidence.csv (write_backing.py --append). With an
# evidence checkout (private repository bcked/bcked-evidence), the reports are copied there under the
# same path. Fails without writing if a new report does not add up.
set -euo pipefail

records=$(realpath "$1")
evidence=${2:+$(realpath "$2")}
here=$(dirname "$(realpath "$0")")
work=$(mktemp -d)
cd "$here"

# Arguments for write_backing.py that copy reports into the evidence checkout, if there is one.
evidence_args() { # <path of the records dir relative to the records checkout>
    if [ -n "$evidence" ]; then echo "--evidence $evidence/$1/evidence"; fi
}

paxos() { # <name> <transparency page> <product pattern> <asset id> <evidence prefix>
    local dir="$records/assets/$4/records"
    python3 fetch_paxos.py "$2" "$3" "$work/$1" > "$work/$1.txt"
    # shellcheck disable=SC2046
    python3 extract_"$1".py $(cat "$work/$1.txt") > "$work/$1.json"
    python3 check_new.py "$work/$1.json" "$dir/backing.csv"
    # shellcheck disable=SC2046
    python3 write_backing.py "$work/$1.json" "$dir" "$5" --append $(evidence_args "assets/$4/records")
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
# shellcheck disable=SC2046
python3 write_backing.py "$work/tether-units.json" "$tether" USDT --append $(evidence_args entities/tether/records)

circle="$records/entities/circle/records"
python3 fetch_circle.py "$work/circle" > "$work/circle.txt"
# shellcheck disable=SC2046
python3 extract_circle.py circle_manual.json $(cat "$work/circle.txt") > "$work/circle.json"
python3 check_new.py "$work/circle.json" "$circle/backing.csv"
# shellcheck disable=SC2046
python3 write_backing.py "$work/circle.json" "$circle" USDC --append $(evidence_args entities/circle/records)

xaut="$records/assets/ethereum:0x68749665FF8D2d112Fa859AA293F07A622782F38/records"
python3 fetch_xaut.py "$work/xaut" > "$work/xaut-reports.json"
python3 extract_xaut.py "$work/xaut-reports.json" > "$work/xaut.json"
python3 check_new.py "$work/xaut.json" "$xaut/backing.csv"
# shellcheck disable=SC2046
python3 write_backing.py "$work/xaut.json" "$xaut" XAUT --append $(evidence_args "assets/ethereum:0x68749665FF8D2d112Fa859AA293F07A622782F38/records")
