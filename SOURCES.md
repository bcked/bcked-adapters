# Data sources

Every source the adapters and scripts read, what it is used for, and the terms that apply. bcked's
license covers the code and bcked's own data, such as the extracted reserve compositions, backing in
units and the computed ratios. Data taken from these sources stays under the terms of its source.
Attribution is given here, in the [methodology](https://bcked.com/methodology) and next to the data
on bcked.com.

## Issuer reports and pages

| Source                                                                                                       | Used for                                                                         | Terms and notes                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Tether transparency](https://tether.to/en/transparency/)                                                    | Reserves of USDT from the quarterly assurance reports (BDO, MHA Cayman)          | Reports belong to Tether and its auditors. The PDFs are not republished: `evidence.csv` lists date, SHA-256 hash and download URL, copies are kept in a private repository |
| [Tether transparency page, archived](https://web.archive.org/web/2020/https://wallet.tether.to/transparency) | Monthly total reserves from 2018-11 to 2021-01, when Tether published no reports | Read from the [Wayback Machine](https://archive.org/about/terms.php). Tether's own, unaudited totals                                                                       |
| [Circle transparency](https://www.circle.com/transparency)                                                   | Reserves of USDC from the monthly attestation reports (Grant Thornton, Deloitte) | As for Tether. Until 2025-11 the Circle Reserve Fund was crawled from BlackRock, whose terms do not allow that. It was replaced by the reports on 2026-10-30               |
| [Paxos transparency](https://paxos.com/)                                                                     | Reserves of PAXG and BUSD from the monthly attestation reports                   | As for Tether                                                                                                                                                              |
| [wbtc.network](https://wbtc.network/)                                                                        | WBTC custodian holdings and custodian addresses                                  | Public API of the WBTC DAO                                                                                                                                                 |

## Prices and supply

| Source                                                          | Used for                                                                                                          | Terms and notes                                                                  |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [DefiLlama](https://defillama.com/) (coins and stablecoins API) | Token prices, stablecoin circulating supply per chain, blocks by date                                             | [Terms](https://defillama.com/terms). Permission to republish is being requested |
| [DexScreener](https://dexscreener.com/)                         | Prices of tokens without a DefiLlama price                                                                        | [API terms](https://docs.dexscreener.com/api/api-terms-and-conditions)           |
| [mempool.space](https://mempool.space/)                         | Bitcoin price, block heights by date, bitcoin transactions of WBTC custodians for the 2025-11 to 2026-10 backfill | Open source (AGPL), public API                                                   |
| [Blockstream Esplora](https://github.com/Blockstream/esplora)   | Bitcoin block height, custodian transactions                                                                      | MIT licensed software, public API                                                |
| [Swissquote](https://www.swissquote.com/)                       | Gold price                                                                                                        | Public price feed. Terms not reviewed yet                                        |
| [currency-api](https://github.com/fawazahmed0/exchange-api)     | Daily gold price for the backfill                                                                                 | CC0                                                                              |
| [ultrasound.money](https://ultrasound.money/)                   | ETH supply for the backfill                                                                                       | Public API                                                                       |

## Chains

| Source                                                                                             | Used for                                       | Terms and notes                                                                                                             |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [Etherscan](https://etherscan.io/apis)                                                             | Ethereum contract data                         | [Terms](https://etherscan.io/terms). Attribution "Powered by Etherscan.io APIs". Permission to republish is being requested |
| [Alchemy](https://www.alchemy.com/)                                                                | RPC for Ethereum, Arbitrum, Polygon and Solana | [Terms](https://www.alchemy.com/policies/terms). Contract calls, the results are facts                                      |
| [dRPC](https://drpc.org/), [1RPC](https://1rpc.io/), public Moonbeam, Moonriver and BNB Chain RPCs | Archive calls for the backfill, other chains   | Public RPC endpoints                                                                                                        |

## Official statistics

| Source                                                                                       | Used for                                           | Terms and notes                                                                                     |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [Federal Reserve H.6](https://www.federalreserve.gov/releases/h6/)                           | US dollar money supply                             | Public domain (US government work)                                                                  |
| [TreasuryDirect](https://www.treasurydirect.gov/), [US Treasury](https://home.treasury.gov/) | Treasury securities and auctions                   | Public domain (US government work)                                                                  |
| [USGS](https://www.usgs.gov/)                                                                | Gold supply until 2018                             | Public domain (US government work)                                                                  |
| [World Gold Council](https://www.gold.org/goldhub/data/how-much-gold)                        | Above-ground gold stock from 2019 (yearly figures) | [Terms](https://www.gold.org/terms-and-conditions): reproduction with accreditation, single figures |

## Not used anymore

- BlackRock (holdings of the Circle Reserve Fund): crawled until 2025-11, replaced by Circle's reports. The crawled files were removed from the `records` branch on 2026-10-30.
- BitGo (Bitcoin price): replaced by mempool.space on 2026-10-30. BitGo stays the issuer of WBTC in the data.
