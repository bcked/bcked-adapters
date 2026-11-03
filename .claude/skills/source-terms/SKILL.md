---
name: source-terms
description: Checks whether bcked may use a data source (API, website, report, RPC endpoint, file or logo) before any data from it is read, and records the decision with an archived copy of the terms. Use before adding a token, a chain, a price or supply source, an attestation report, an icon, or any other outside data, and whenever an issue or pull request introduces a source.
---

# Source terms

bcked republishes data through a public site and a free API, collected automatically. A source may
only be used if its terms allow that. Facts themselves are not protected, but terms can still forbid
automated access or republishing, and logos are trademarks.

## 1. Look it up first

The registry of every source checked so far is `terms/REGISTRY.md` in the private repository
`bcked/bcked-evidence` (maintained in `terms/services.toml`). Clone it if needed:

```shell
git clone --filter=blob:none --sparse git@github.com:bcked/bcked-evidence.git
cd bcked-evidence && git sparse-checkout set --no-cone /terms/ /.github/ /README.md
```

- Listed as `used`: use it as the decision says.
- Listed as `conditional`: use it only under the conditions in the decision.
- Listed as `not-allowed`: do not use it. Look for another source.
- Not listed: continue with step 2.

## 2. Find the terms

Find every document that can apply: the site's terms of use, API terms, developer terms, data or
acceptable use policies, brand guidelines (for logos), the license of a repository, and for an RPC
endpoint the terms of whoever runs it (the hostname often names a provider, e.g. Gelato or QuickNode).
Check the footer, `/terms`, `/legal`, `/tos` and the docs. A page that answers 403 or 429, or shows a
bot check, is not worked around: use the operator's published sources (e.g. their GitHub) or record
the page as not reachable.

## 3. Read them in full and decide

Read the whole text, not a summary, and note who the terms bind (website visitors, API users, account
holders only) and what they cover (the website, an API, the RPC, the data).

| Decision    | When                                                                                                                                                                                                                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| used        | On-chain contract state through an RPC whose terms do not forbid it. Public domain or open licences (CC0, CC-BY with attribution, MIT, AGPL). APIs or sites whose terms allow automated use and republishing. Terms that do not cover what bcked uses (e.g. website terms for a public RPC).                                                                                   |
| conditional | Issuer reports where the website terms forbid copying content in general but not automated collection: only the figures (facts) are published, with attribution and a link to each report. No PDFs, no logos. Permission is requested.                                                                                                                                         |
| not-allowed | Personal or non-commercial use only. Explicit bans on automated access, scraping, bots or data mining that cover what bcked would read. Bans on republishing or redistributing the data, or on making it available to third parties. An account is required and bcked has none. Public endpoints meant only for development whose operator forbids systematic data collection. |

Logos: use an issuer's logo only if its terms or brand guidelines allow use to identify the token.
Otherwise the icon is a generic placeholder until the issuer gives permission.

## 4. Record and archive

In `bcked-evidence`, add the source to `terms/services.toml` (status, what it is used for, the
deciding clauses as short quotes, the date, the terms URLs), then archive it and commit:

```shell
python3 terms/archive.py <id>      # stores the terms as published and as text, plus a Wayback capture
git add terms && git commit -m "Terms: <source>" && git push
```

When several agents work in parallel, do not edit `services.toml` yourself: hand the entry (TOML) to
the coordinator, who adds all entries and runs the archive once.

## 5. Keep the analysis private

The reasoning, quotes and risk assessment stay in `bcked-evidence`. Public places (SOURCES.md,
issues, pull requests, code comments) get at most one neutral line per source: what is not used and
why, e.g. "Its terms allow personal, non-commercial use only." Never describe sources bcked used
before, or how it stopped using them.
