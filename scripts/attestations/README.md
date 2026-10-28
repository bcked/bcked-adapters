# Attestation scripts

Some issuers only publish their reserves in attestation reports (PDF). These scripts download the
reports, extract the reserve composition per report date and write it to the records of the asset,
together with the report as evidence. They require Python 3.9+ and `pdftotext` (poppler-utils).

The records live on the `records` branch. Check it out next to this repository (or into `.records`)
and pass the records folder of the asset, e.g. `assets/<asset id>/records`.

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

## How the reports are read

- Report dates are at 5:00 PM New York time and stored in UTC.
- PAXG: fine troy ounces of gold held in custody (`rwa:XAU`).
- BUSD until 2022-07: only the total reserve, a mix of deposits, U.S. government debt and PAX tokens,
  recorded as `rwa:undefined`. If a report describes the reserve as deposits only, it is `rwa:USD`.
- BUSD 2022-08 to 2025-01: holdings per CUSIP. Treasury bills are `rwa:USTB`, other Treasury debt
  is split by CUSIP into bonds (`912810…`, `rwa:USTBOND`) and notes (`rwa:USTNOTE`), dollars are `rwa:USD`.
- BUSD from 2025-02: KPMG's Exhibit B by asset type. Repurchase agreements are `rwa:USTrepo`,
  government money market funds `rwa:undefined`.
- `validate_busd.py` compares the extracted values with the subtotals in each report. Known report
  errors: the total differs from the subtotals on 2022-10-19, 2022-10-31 and 2023-02-13, and the
  debt subtotal on 2024-07-26 is 45,000 higher than its holdings. The holdings are used.
