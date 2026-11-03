---
name: add-token
description: Adds a token to bcked with full tracking (price, supply per chain, backing, icons) from sources bcked may use, and backfills its history from the chain. Use for a token request issue ("Add token: …"), when asked to track a token, stablecoin, RWA, wrapped or liquid staking token, or when an issue asks whether a token can be tracked. Ends with a draft pull request, or with an issue comment that states what cannot be tracked and whom to ask.
---

# Add a token

Work on one token at a time. The result is either a draft pull request that tracks the token, or a
comment on its issue that says what cannot be tracked, why, and whom to ask. Leave the issue open in
the second case.

## 1. Identify the token

- Get the contract addresses from the issuer's own documentation or website, one per chain. Issue
  links to aggregators are only hints: some symbols are shared by several tokens.
- Check eligibility (CONTRIBUTING.md): it claims to be backed, the backing can be checked from public
  sources, and its market cap is at least $100M, measured from its on-chain supply and price.
  Not eligible: comment why and stop.

## 2. List the data and check every source

Price, supply on each chain, backing (what and how much), the issuer, icons. For each, find the source
and run the `source-terms` skill on it before reading any data. Order of preference:

1. On-chain: the token contracts (supply), the contracts that hold the backing (balances, vaults,
   positions), [Chainlink](https://docs.chain.link/data-feeds) feeds (price, proof of reserves).
2. The issuer's own published figures: attestation reports, a transparency page or API, if allowed.
3. Nothing else. Price and market data aggregators and explorer APIs are not used. If no allowed
   source exists for a value, it stays empty.

## 3. Implement

Follow "How a token is defined" in CONTRIBUTING.md and copy the closest existing asset:

- Asset: `assets/<system>:<address>/index.ts` and `icon.svg`. A token on several chains also gets
  `tokens/<id>/index.ts`, and each chain asset sets `token`.
- Issuer: `entities/<id>/`. Chain: `systems/<id>/`, plus its RPC in `RPC_URLS` and `CHAIN_IDS`
  (`src/crawler/chains/evm.ts`) and in `src/crawler/chains/proxy.ts`. Use Alchemy where it supports
  the chain, otherwise the official RPC after its terms are checked.
- Price: a Chainlink feed in `FEEDS` and `PRICE_SOURCES` (`src/crawler/apis/chainlink.ts`). No feed:
  no price, and say so in the pull request.
- Supply: `onChainSupply` (`src/crawler/adapters/circulating.ts`) or `ChainProxy.getSupply`. Exclude
  tokens the issuer holds itself if they are identifiable on-chain.
- Backing on-chain: `ChainProxy.getBalance` or `call` on the holding contracts (see WETH, DAI).
  Backing from reports: an extractor in `scripts/attestations`, reserves on the token or asset, and
  `getTokenBackingShare` for each chain (see USDC, USDG). Write the source and any limit in
  `backing.description`, which the token page shows.
- Icons: the official logo only if the issuer's terms allow it, else a generic placeholder in the
  style of the existing ones. Check `src/icons.test.ts`.

## 4. Backfill history from the chain

The crawler only records from the day an asset is added. Rebuild the past from the chain wherever
possible:

- Supply: add the token to `SUPPLY` in `scripts/history/rebuild_onchain.ts` (daily totalSupply
  through archive calls). Add its chain to `RPC` there if needed.
- Price: a Chainlink feed in `PRICE_SOURCES` is rebuilt by `scripts/history/rebuild_prices.ts`. Before
  the feed existed: add the token's pools to `ASSETS` in `scripts/history/dex_prices.py` (at least
  $1M liquidity).
- On-chain backing: extend `rebuild_onchain.ts` with the balance or call the adapter reads, at the
  same daily blocks.
- Report backing: extract all past reports, not only the latest.

Note in the pull request which history the maintainer must run after the merge, e.g.
`gh workflow run "Rebuild History" -f part=onchain -f onchain_from_year=2024`. Never write to the
records repository from a branch.

## 5. Check and open the pull request

```shell
bun test && bun run check && bun run lint && bunx prettier --check .
```

Run the new adapters against the live chains. Without RPC keys locally, push the branch and use the
workflow, which has them, then read its log:

```shell
gh workflow run "Verify Adapter" --ref <branch> -f targets="assets/<system>:<address> tokens/<id>"
gh run watch "$(gh run list -w "Verify Adapter" -L1 --json databaseId -q '.[0].databaseId')" --exit-status
```

Check the values against the issuer's own figures (supply, reserves) before opening the pull request.

Open a draft pull request that says "Closes #<issue>", lists every source with what it provides,
what stays empty and why, and the history to run. Do not merge it yourself.

## 6. When it cannot be tracked fully

Comment on the issue and leave it open:

- what can be tracked (price, supply, backing) and from which source,
- what cannot, with one neutral line per source, e.g. "The reserve reports' terms do not allow
  automated collection.",
- whom to ask for permission: the issuer's official contact for legal, partnerships or press, taken
  from its own website (link the page). Do not guess addresses.

Partial tracking is fine: track what is allowed (e.g. price and supply) and leave the rest empty.
