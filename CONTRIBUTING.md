# Contributing

bcked tracks how much backing sits behind a token: what it holds, how much of it, and since when.
Every tracked token is a folder in this repository. The more tokens the community adds, the more
backing chains bcked can show.

## Ways to contribute

1. **Request a token.** Open the [token request form](https://github.com/bcked/bcked-adapters/issues/new?template=add-token.yml)
   with a link to where the backing is published. Someone else writes the adapter.
2. **Pick up a request.** All open requests carry the label
   [`token-request`](https://github.com/bcked/bcked-adapters/issues?q=is%3Aissue+is%3Aopen+label%3Atoken-request).
   Comment on the issue before you start, so work is not done twice.
3. **Report wrong data.** Open the [correction form](https://github.com/bcked/bcked-adapters/issues/new?template=correction.yml)
   with the asset, what is wrong and a source for the correct value.
4. **Improve the code.** Bugs and features are tracked as issues. Small fixes can go straight to a pull request.

## Which tokens are tracked

A token is eligible if all of the following hold:

- **It claims to be backed.** By fiat, government debt, commodities, other tokens or a fund share.
  Purely algorithmic tokens without reserves are out of scope.
- **The backing can be checked from public sources.** On-chain balances, an API of the issuer, or
  published attestation or audit reports. Backing that is only stated in marketing text is not enough.
- **It has a circulating market cap of at least $100M.** Measured from its supply and price at the
  time of the request.

Assets that back an already tracked token are always eligible, whatever their market cap, because the
backing chain is incomplete without them.

Tokens below the threshold, or not yet measured, are listed in [`watchlist.csv`](watchlist.csv) with
official sources. Their market cap is measured on-chain (supply times price) when the list is checked
again, with the date. A token that grows past the threshold becomes a request.

## How a token is defined

Each token is one folder under `assets/`, named `<system>:<address>`, for example
`assets/ethereum:0x45804880De22913dAFE09f4980848ECE6EcbAf78` for PAX Gold on Ethereum. The same token
on another chain is a separate asset, because bridges and wrappers add their own risk.

```text
assets/ethereum:0x45804880De22913dAFE09f4980848ECE6EcbAf78/
  index.ts    details and the adapter that reads price, supply and backing
  icon.svg    the token icon, required (see Icons below)
  records/    collected data, not in this repository
```

`index.ts` exports the asset details (name, symbol, identifier, asset classes, issuer, reference link,
tags) and a class with `getPrice`, `getSupply` and `getBacking`. Most tokens reuse the shared helpers:

- Price: `ApiProxy.getPrice` (Chainlink feeds on Ethereum, see `src/crawler/apis/chainlink.ts`). A new token needs a feed in `PRICE_SOURCES`.
- Supply: `ChainProxy.getSupply` (total supply minus tokens at burn addresses).
- Backing on-chain: `ChainProxy.getBalance` for tokens held by a contract (see WETH).
- Backing of an issuer that reports for all chains together: record the reserves on the issuer entity
  and use `getTokenBackingShare` (see USDT and USDC).
- Backing from attestation reports: the scripts in [`scripts/attestations`](scripts/attestations).
  Every report is listed in `evidence.csv` next to the records with its download URL and SHA-256
  hash. The reports belong to their issuers and auditors, so the PDFs are not published here.
- No backing that can be recorded: declare it anyway, with `backing.method` `"not-tracked"` and the
  reason in `backing.description`. The site then shows "Backing not tracked" instead of no reserves.

Issuers are folders under `entities/` and chains under `systems/`. A product on several chains (USDT, USDC) is a folder under `tokens/`, with the reserves its issuer reports for all chains together. Each of its chain assets links it in `token` and gets its chain's share. Copy an existing asset as a starting
point and change the details. Every asset, issuer and chain needs an `icon.svg`, and `bun test` fails
without one.

## Rules for data

- Every value comes from a public source whose terms allow automated collection and republishing, and
  the adapter or record names it. [SOURCES.md](SOURCES.md) lists the sources in use and the ones that
  are not used because of their terms. Maintainers can use the `add-token` and `source-terms` skills in
  `.claude/skills`.
- Backing is recorded in units of the underlying asset (ounces, BTC, USD), not converted to USD.
  The API converts with the price at the same time.
- Report dates are stored in UTC with the time the report states.
- When a source is wrong or a report contradicts itself, record what the report says and note the
  problem in the adapter. Do not correct values by guessing.
- Every statement about an asset, like a `warning` that a token is discontinued, links an external
  source in `reference`. Prefer an official one: the regulator, the issuer or the auditor, over news.

## How do I get set up?

The project runs on [Bun](https://bun.sh/), which executes the TypeScript sources directly.

```shell
curl -fsSL https://bun.sh/install | bash
cd bcked-adapters
bun install
```

API keys for the data sources are read from a `.env` file in the project root
(`ALCHEMY_ETHEREUM`, `ALCHEMY_POLYGON`, `ALCHEMY_SOLANA`, `ALCHEMY_ARBITRUM`).
Bun loads it automatically.

## How to locally run the adapters?

Collected records are stored in a private repository and are not published as files. The data on
bcked.com is available through the [bcked API](https://api.bcked.com/docs/). To run the adapters
locally, start without records: the crawler creates the `records` folders in `assets/`, `entities/`,
`tokens/` and `systems/`. They are ignored by git on `main`.

```shell
bun run crawler      # query all adapters and append new records
bun run api          # build the API resources into ./api
bun run verify-api   # check that every resource was built
```

## How do I run tests and checks?

```shell
bun test
bun run check
bun run lint
```

Pull requests run the same checks in CI.

## Icons

Every asset, issuer and chain has an icon. `src/icons.test.ts` checks that the file exists, has a
square view box, is at most 30 KB and has no text elements.

- For a token or company, use the official logo from the issuer's website or press kit, or one of the
  sources below, if the issuer's terms or brand guidelines allow its use to identify the token.
  Otherwise use a generic placeholder until the issuer allows it. Logos stay the property of their
  owners and are used to identify the asset.
- For generic assets without a logo (for example Treasury bills or repurchase agreements), draw a simple
  icon in the style of the existing ones: a filled circle with a white glyph, as in `assets/rwa:USD` and
  `assets/rwa:USTB`. Variants of one asset share the glyph (when-issued Treasuries add a dashed ring).

### General considerations

- Original image is stored in SVG format
- Original image must have a minimum resolution of 256
- If the original is only available as PNG or JPEG, either embed the SVG
  or trace the image.

### Rules for SVGs

- Square view box (`viewBox` attribute, not only `width` and `height`)
- Preferably a normalized view box of 256x256
- All text should be presented as outlines
- File name `icon.svg`
- File size <=30kb
- Transparent background
- Prettified markup (not minified)
- Remove any unnecessary content like doctype, XML instructions, comments, editor data
- Include xmlns for HTML embedding

#### How to resize view box?

1.  Open SVG in Inkscape.
2.  Select all objects in the SVG (STRG + A).
3.  Navigate to "Object" -> "Transform" -> "Scale"
4.  Select "px"
5.  Select "Scale propertionally"
6.  Enter 256 for width and height
7.  Press apply
8.  Open "File" -> "Document Properties"
9.  Adjust "Custom size" width and height to 256 and close window
10. "File" -> Save a Copy

#### How to prettify SVG?

To simplify the SVG, use [SVGO](https://github.com/svg/svgo), then format with prettier:

```shell
bunx svgo --multipass --pretty --indent 2 -p 1 icon.svg -o icon.svg
```

Lower precision (`-p 1`) keeps large logos below 30 KB. Check the result visually.

### Helpful resources

#### Crypo related

- [coinwink/crypto-logos-cc](https://github.com/coinwink/crypto-logos-cc)
- [yearn/yearn-assets](https://github.com/yearn/yearn-assets)
- [curvefi/curve-assets](https://github.com/curvefi/curve-assets)
- [logotyp.us](https://logotyp.us/)

#### General SVG icons

- [publicdomainvectors.org](https://publicdomainvectors.org/)
- [SVG Repo](https://www.svgrepo.com/)
