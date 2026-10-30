# Attestation scripts

Some issuers only publish their reserves in attestation reports (PDF). These scripts download the
reports, extract the reserve composition per report date and write it to the records of the asset,
and list each report in `evidence.csv`. They require Python 3.9+ and `pdftotext` (poppler-utils).

The records live on the `records` branch. Check it out next to this repository (or into `.records`)
and pass the records folder of the asset, e.g. `assets/<asset id>/records`.

## Automatic updates

The workflow `Attestation Update` runs `update.sh` every Monday. It downloads the Paxos, Tether and
Circle reports, checks every report date after the latest recorded row against the report total
(`check_new.py`) and appends those rows, listing each report in `evidence.csv` with its download URL
and SHA-256 hash (`write_backing.py --append`). With the secret `EVIDENCE_DEPLOY_KEY` (a deploy key of
the private repository bcked/bcked-evidence), the PDFs are also copied there.
If a new report does not add up, for example because its layout changed, the run fails and nothing
is written. Extract that report by hand with the commands below.

```shell
scripts/attestations/update.sh <records checkout> [<bcked-evidence checkout>]
```

The commands below rebuild the full history of an asset from all reports.

## Paxos (PAXG, BUSD)

```shell
python3 fetch_paxos.py https://www.paxos.com/paxg-transparency "PAX Gold|PAXG" /tmp/paxg > paxg.txt
python3 extract_paxg.py $(cat paxg.txt) > paxg.json
python3 write_backing.py paxg.json "<records>/assets/ethereum:0x45804880De22913dAFE09f4980848ECE6EcbAf78/records" PAXG

python3 fetch_paxos.py https://www.paxos.com/busd-transparency "Binance USD|BUSD" /tmp/busd > busd.txt
python3 extract_busd.py $(cat busd.txt) > busd.json
python3 validate_busd.py busd.json
python3 write_backing.py busd.json "<records>/assets/ethereum:0x4Fabb145d64652a948d72533023f6E7A623C7C53/records" BUSD
```

## Tether (USDT)

Tether's reports cover all chains, so the reserves are recorded on the token `usdt`. The USDT adapters
derives the backing of USDT on Ethereum from it (see `src/crawler/adapters/issuer_backing.ts`).

```shell
python3 fetch_tether.py /tmp/tether > tether-reports.json
python3 extract_tether.py tether-reports.json tether_manual.json > tether.json
python3 convert_prices.py tether.json > tether-units.json
python3 write_backing.py tether-units.json "<records>/tokens/usdt/records" USDT
```

## Tether Gold (XAUt)

The quarterly reports of TG Commodities state the fine troy ounces of gold held for all XAUt tokens.
`fetch_xaut.py` reads the report list from the gold.tether.to bundle, `update.sh` adds new reports.

```shell
python3 fetch_xaut.py /tmp/xaut > xaut-reports.json
python3 extract_xaut.py xaut-reports.json > xaut.json
python3 write_backing.py xaut.json "<records>/assets/ethereum:0x68749665FF8D2d112Fa859AA293F07A622782F38/records" XAUT
```

## Circle (USDC)

Circle's reserves are recorded on the token `usdc`, from its attestation reports only. Each report
lists two dates. `update.sh` adds new reports every week (`fetch_circle.py` takes the newest from the
transparency page). Until 2025-11 the Circle Reserve Fund was crawled daily from BlackRock, whose
terms do not allow that. Those rows were replaced by the report dates on 2026-10-30.

```shell
python3 extract_circle.py circle_manual.json /tmp/circle/*.pdf > circle.json
python3 write_backing.py circle.json "<records>/tokens/usdc/records" USDC
```

The USDC report PDFs are linked on https://www.circle.com/transparency (all PDFs with "USDC" in the name).

## How the reports are read

- Report dates are at 5:00 PM New York time and stored in UTC.
- PAXG: fine troy ounces of gold held in custody (`rwa:XAU`).
- BUSD until 2022-07: only the total reserve, a mix of deposits, U.S. government debt and PAX tokens,
  recorded as `rwa:undefined`. If a report describes the reserve as deposits only, it is `rwa:USD`.
- BUSD 2022-08 to 2025-01: holdings per CUSIP. Treasury bills are `rwa:USTB`, other Treasury debt
  is split by CUSIP into bonds (`912810…`, `rwa:USTBOND`) and notes (`rwa:USTNOTE`), dollars are `rwa:USD`.
- BUSD from 2025-02: KPMG's Exhibit B by asset type. Repurchase agreements are `rwa:USTrepo`,
  government money market funds `rwa:MMF`.
- `validate_busd.py` compares the extracted values with the subtotals in each report. Known report
  errors: the total differs from the subtotals on 2022-10-19, 2022-10-31 and 2023-02-13, and the
  debt subtotal on 2024-07-26 is 45,000 higher than its holdings. The holdings are used.
- Tether: U.S. Treasury bills are `rwa:USTB`, reverse repurchase agreements `rwa:USTrepo`, cash and
  bank deposits `rwa:USD`. Precious metals and Bitcoin are converted from USD to troy ounces (`rwa:XAU`)
  and BTC (`bitcoin:BTC`) with the DefiLlama price at the report date (`convert_prices.py`). Commercial
  paper and certificates of deposit are `rwa:CP`, secured loans `rwa:LOAN`, money market funds
  `rwa:MMF`, public equities `rwa:EQUITY`, corporate bonds `rwa:CORPBOND` and non-U.S. treasury bills
  `rwa:NONUSTB`. Other investments, which Tether does not break down, and the 2021 and 2022 line
  "Corporate Bonds, Funds & Precious Metals", one sum of three kinds of assets, are `rwa:undefined`. Feb and Mar 2021 only report total assets. The bank confirmations of 2017 and 2018
  were read manually (`tether_manual.json`), the 2018-10 Deltec letter is a scan.
  From 2018-11 to 2021-01 Tether published no reports. Monthly totals from its archived transparency
  page fill that time as `rwa:undefined` (`backfill_tether_transparency.py`). They are Tether's own
  unaudited numbers.
- Circle until 2021-04: US dollars in custody accounts (`rwa:USD`). 2021-05 to 2021-10: the breakdown
  table (cash, Yankee CDs and commercial paper as `rwa:CP`, US Treasuries as `rwa:USTB`, corporate
  bonds), scaled to the USDC in circulation. 2022-07 to 2022-12: treasuries by CUSIP and cash.
  2021-11 to 2022-06: only the total of a mix
  of cash and short-dated U.S. government obligations (`rwa:undefined`, "Composition not reported"). The 2022 reserve pages use a broken font, so the total is read from the auditor's
  letter. The May 2022 report is a scan and was read manually (`circle_manual.json`). From 2023:
  Treasuries by CUSIP, repurchase agreements and cash, checked against the total reserve assets.
- Times: Paxos reports are at 5:00 PM New York time, Circle reports at 11:59 PM Pacific time, Tether
  reports at the end of the day (UTC). All are stored in UTC.
