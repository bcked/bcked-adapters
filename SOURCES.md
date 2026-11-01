# Data sources

Every source the adapters and scripts read, what it is used for, and the terms that apply. bcked's
license covers the code and bcked's own data, such as the extracted reserve compositions, backing in
units and the computed ratios. Data taken from these sources stays under the terms of its source.
Attribution is given here, in the [methodology](https://bcked.com/methodology) and next to the data
on bcked.com.

## Issuer reports and figures

| Source                                                                                                       | Used for                                                                                                                                                                                    | Terms and notes                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Tether transparency](https://tether.to/en/transparency/)                                                    | Reserves of USDT from the quarterly assurance reports (BDO, MHA Cayman). Circulating USDT per chain and in total from [Tether's transparency data](https://app.tether.to/transparency.json) | Only figures from the reports are used, with a link to each report. The PDFs are not republished: `evidence.csv` lists date, SHA-256 hash and download URL, copies are kept in a private repository |
| [Tether transparency page, archived](https://web.archive.org/web/2020/https://wallet.tether.to/transparency) | Monthly total reserves from 2018-11 to 2021-01, when Tether published no reports                                                                                                            | Tether's own, unaudited totals, read from the Wayback Machine                                                                                                                                       |
| [Tether Gold](https://gold.tether.to/reports)                                                                | Gold of XAUt from the quarterly attestation reports (TG Commodities), minted tokens from Tether's transparency data                                                                         | As for Tether                                                                                                                                                                                       |
| [Circle transparency](https://www.circle.com/transparency)                                                   | Reserves of USDC from the monthly attestation reports (Grant Thornton, Deloitte)                                                                                                            | As for Tether                                                                                                                                                                                       |
| [Paxos transparency](https://paxos.com/)                                                                     | Reserves of PAXG, BUSD, PYUSD and USDG from the monthly attestation reports                                                                                                                 | As for Tether                                                                                                                                                                                       |

## Prices and supply

| Source                                                        | Used for                                                                                                                                                                                                                    | Terms and notes                                                 |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [Chainlink Data Feeds](https://docs.chain.link/data-feeds)    | Prices of all tokens, ETH, BTC and gold, and the bitcoin held by the WBTC custodians ([WBTC Proof of Reserves](https://data.chain.link/feeds/ethereum/mainnet/wbtc-por)). Read on-chain from the feed contracts on Ethereum | Values published on-chain. Chainlink's software is MIT licensed |
| Token contracts on each chain                                 | Supply of every token (totalSupply), share prices of funds held by the Sky allocators (Centrifuge vaults)                                                                                                                   | Read on-chain. Contract state, the results are facts            |
| [ultrasound.money](https://ultrasound.money/)                 | ETH supply                                                                                                                                                                                                                  | Public API                                                      |
| [mempool.space](https://mempool.space/)                       | Bitcoin price, block heights by date, bitcoin transactions of WBTC custodians for the 2025-11 to 2026-10 backfill                                                                                                           | Open source (AGPL), public API                                  |
| [Blockstream Esplora](https://github.com/Blockstream/esplora) | Bitcoin block height, custodian transactions                                                                                                                                                                                | MIT licensed software, public API                               |
| [currency-api](https://github.com/fawazahmed0/exchange-api)   | Daily gold price for the backfill                                                                                                                                                                                           | CC0                                                             |

## Chains

| Source                                                                                                           | Used for                                                                                                                                                   | Terms and notes                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Alchemy](https://www.alchemy.com/)                                                                              | RPC for Ethereum, Arbitrum, Polygon and Solana, archive calls, token transfers                                                                             | [Terms](https://legal.alchemy.com/). Contract calls, the results are facts                                                                                                                     |
| Official public RPCs of Base, Avalanche, X Layer, Ink, Robinhood Chain, Plume, Moonbeam, Moonriver and BNB Chain | Contract calls on these chains                                                                                                                             | Run by the chains' developers for public use                                                                                                                                                   |
| [Sky Chainlog](https://chainlog.sky.money/)                                                                      | Addresses of the Sky contracts (Vat, Lite PSM, vault joins) for the reserves of DAI and USDS                                                               | Read on-chain from the Chainlog contract                                                                                                                                                       |
| [Spark address registry](https://github.com/sparkdotfi/spark-address-registry)                                   | Contracts of the Spark allocator (ALM proxies, SparkLend, vaults) on Ethereum, Base and Arbitrum                                                           | AGPL-3.0 repository. Positions are read on-chain. The Obex proxy is taken from the USDS transfers of its allocator buffer                                                                      |
| [Grove address registry](https://github.com/grove-labs/grove-address-registry)                                   | Contracts of the Grove allocator (ALM and PAU proxies, vaults, funds, off-chain deposit addresses) on Ethereum, Base, Avalanche, Plume and Robinhood Chain | AGPL-3.0 repository. Positions are read on-chain. USDC lent off-chain is summed from transfers with [Alchemy's transfer API](https://www.alchemy.com/docs/reference/alchemy-getassettransfers) |

## Official statistics

| Source                                                                                       | Used for                         | Terms and notes                    |
| -------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------- |
| [Federal Reserve H.6](https://www.federalreserve.gov/releases/h6/)                           | US dollar money supply           | Public domain (US government work) |
| [TreasuryDirect](https://www.treasurydirect.gov/), [US Treasury](https://home.treasury.gov/) | Treasury securities and auctions | Public domain (US government work) |
| [USGS](https://www.usgs.gov/)                                                                | Gold supply until 2018           | Public domain (US government work) |

## Not used because of their terms

- [Ripple USD transparency reports](https://ripple.com/products/stablecoin/transparency/): monthly reserve
  reports of RLUSD. RLUSD is tracked with price and supply, its backing is not recorded until Ripple
  allows it.
- [Agora attestations](https://developer.agora.finance/attestations): monthly reserve reports of AUSD.
  AUSD is tracked with price and supply and a generic icon, its backing is not recorded until Agora
  allows it.

## Not used anymore

- DefiLlama, DexScreener, Etherscan, Swissquote, the World Gold Council, wbtc.network and PublicNode:
  replaced on 2026-11-01 by Chainlink feeds, on-chain supply, Tether's own figures, ultrasound.money and
  the chains' official RPCs. Their data is no longer published.
- BlackRock (holdings of the Circle Reserve Fund): crawled until 2025-11, replaced by Circle's reports.
- BitGo (Bitcoin price): replaced by mempool.space on 2026-10-30. BitGo stays the issuer of WBTC in the data.
