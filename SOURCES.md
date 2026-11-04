# Data sources

Every source the adapters and scripts read, what it is used for, and the terms that apply. bcked's
license covers the code and bcked's own data, such as the extracted reserve compositions, backing in
units and the computed ratios. Data taken from these sources stays under the terms of its source.
Attribution is given here, in the [methodology](https://bcked.com/methodology) and next to the data
on bcked.com.

## Issuer reports and figures

| Source                                                                                                       | Used for                                                                                                                                                                                                                                                                                                                                           | Terms and notes                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Tether transparency](https://tether.to/en/transparency/)                                                    | Reserves of USDT from the quarterly assurance reports (BDO, MHA Cayman). Circulating USDT per chain and in total from [Tether's transparency data](https://app.tether.to/transparency.json), at past report dates from its snapshots in the Wayback Machine                                                                                        | Only figures from the reports are used, with a link to each report. The PDFs are not republished: `evidence.csv` lists date, SHA-256 hash and download URL, copies are kept in a private repository |
| [Tether transparency page, archived](https://web.archive.org/web/2020/https://wallet.tether.to/transparency) | Monthly total reserves from 2018-11 to 2021-01, when Tether published no reports                                                                                                                                                                                                                                                                   | Tether's own, unaudited totals, read from the Wayback Machine                                                                                                                                       |
| [Tether Gold](https://gold.tether.to/reports)                                                                | Gold of XAUt from the quarterly attestation reports (TG Commodities), minted tokens from Tether's transparency data                                                                                                                                                                                                                                | As for Tether                                                                                                                                                                                       |
| [Circle transparency](https://www.circle.com/transparency)                                                   | Reserves of USDC from the monthly attestation reports (Grant Thornton, Deloitte). Reserves of EURC from its monthly attestation reports. USDC and EURC on Solana at past report dates from snapshots of [Circle's stablecoin data](https://api.circle.com/v1/stablecoins) in the Wayback Machine, EURC on Solana today from that data              | As for Tether                                                                                                                                                                                       |
| [Paxos transparency](https://paxos.com/)                                                                     | Reserves of PAXG, BUSD, PYUSD and USDG from the monthly attestation reports, USDG tokens per chain from their Exhibit A                                                                                                                                                                                                                            | As for Tether                                                                                                                                                                                       |
| [Bridge transparency](https://reserves.bridge.xyz/)                                                          | Reserves of CASH (cash and treasuries) from Bridge's public [transparency API](https://apidocs.bridge.xyz/platform/issuance/reporting-and-transparency), for all chains together. CASH on Solana gets its share by supply                                                                                                                          | Public API without a key. Only the figures are used, with a link to Bridge's page                                                                                                                   |
| [Frax](https://frax.com/)                                                                                    | frxETH backing from Frax's balance sheet API, shown on [Frax Facts](https://facts.frax.finance/frxeth/balance-sheet): ETH in validators, ETH and stETH held by the frxETH contracts and the treasury, liquidity positions at their stated ETH value. frxETH addresses from the [Frax docs](https://docs.frax.com/protocol/assets/frxeth/addresses) | No terms of use published. The docs are MIT licensed. Logos from the [brand page](https://frax.com/brand)                                                                                           |

## Prices and supply

| Source                                                        | Used for                                                                                                                                                                                                                                                                                         | Terms and notes                                                                        |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| [Chainlink Data Feeds](https://docs.chain.link/data-feeds)    | Prices of all tokens, ETH, BTC, gold, the euro and Strategy's STRC preferred share (the collateral of STRCx), and the bitcoin held by the WBTC custodians ([WBTC Proof of Reserves](https://data.chain.link/feeds/ethereum/mainnet/wbtc-por)). Read on-chain from the feed contracts on Ethereum | Values published on-chain. Chainlink's software is MIT licensed                        |
| Token contracts on each chain                                 | Supply of every token (totalSupply), share prices of funds held by the Sky allocators (Centrifuge vaults)                                                                                                                                                                                        | Read on-chain. Contract state, the results are facts                                   |
| [Uniswap](https://uniswap.org/) pools on Ethereum             | Prices of PAXG, WBTC, USDC, BUSD, USDG and EURC at report dates before their Chainlink feed (BUSD never had one). Pool price at the block of the report time, from the pool with the most liquidity (at least $1M), converted with the Chainlink price of WETH or USDC                           | Read on-chain. Contract state, the results are facts                                   |
| [Orca](https://www.orca.so/) USDG/USDC pool on Solana         | Price of USDG from 2025-03 to 2025-05, before it had an Ethereum pool. Median of executed swaps within 6 hours of the report time, converted with the Chainlink USDC price                                                                                                                       | Read on-chain from Solana transactions through a keyed RPC. The transactions are facts |
| [ultrasound.money](https://ultrasound.money/)                 | ETH supply                                                                                                                                                                                                                                                                                       | Public API                                                                             |
| [mempool.space](https://mempool.space/)                       | Bitcoin price, block heights by date, bitcoin transactions of addresses                                                                                                                                                                                                                          | Open source (AGPL), public API                                                         |
| [Blockstream Esplora](https://github.com/Blockstream/esplora) | Bitcoin block height, custodian transactions                                                                                                                                                                                                                                                     | MIT licensed software, public API                                                      |
| [currency-api](https://github.com/fawazahmed0/exchange-api)   | Daily gold price history                                                                                                                                                                                                                                                                         | CC0                                                                                    |

## Chains

| Source                                                                                                           | Used for                                                                                                                                                   | Terms and notes                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Alchemy](https://www.alchemy.com/)                                                                              | RPC for Ethereum, Arbitrum, Polygon and Solana, archive calls, token transfers                                                                             | [Terms](https://legal.alchemy.com/). Contract calls, the results are facts                                                                                                                     |
| Official public RPCs of Base, Avalanche, X Layer, Ink, Robinhood Chain, Plume, Moonbeam, Moonriver and BNB Chain | Contract calls on these chains                                                                                                                             | Run by the chains' developers for public use                                                                                                                                                   |
| [Honeycluster](https://honeycluster.io/)                                                                         | JSON-RPC for the XRP Ledger: issued supply of RLUSD (the issuer's obligations)                                                                             | [Terms](https://honeycluster.io/terms). Ledger state, the results are facts                                                                                                                    |
| [Sky Chainlog](https://chainlog.sky.money/)                                                                      | Addresses of the Sky contracts (Vat, Lite PSM, vault joins) for the reserves of DAI and USDS                                                               | Read on-chain from the Chainlog contract                                                                                                                                                       |
| [Spark address registry](https://github.com/sparkdotfi/spark-address-registry)                                   | Contracts of the Spark allocator (ALM proxies, SparkLend, vaults) on Ethereum, Base and Arbitrum                                                           | AGPL-3.0 repository. Positions are read on-chain. The Obex proxy is taken from the USDS transfers of its allocator buffer                                                                      |
| [Grove address registry](https://github.com/grove-labs/grove-address-registry)                                   | Contracts of the Grove allocator (ALM and PAU proxies, vaults, funds, off-chain deposit addresses) on Ethereum, Base, Avalanche, Plume and Robinhood Chain | AGPL-3.0 repository. Positions are read on-chain. USDC lent off-chain is summed from transfers with [Alchemy's transfer API](https://www.alchemy.com/docs/reference/alchemy-getassettransfers) |
| [Spiko contracts repository](https://github.com/spiko-tech/contracts)                                            | Addresses of the USTBL token contracts on Ethereum, Polygon, Arbitrum and Base                                                                             | MIT licensed repository. Supply is read on-chain                                                                                                                                               |

## Official statistics

| Source                                                                                       | Used for                         | Terms and notes                    |
| -------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------- |
| [Federal Reserve H.6](https://www.federalreserve.gov/releases/h6/)                           | US dollar money supply           | Public domain (US government work) |
| [TreasuryDirect](https://www.treasurydirect.gov/), [US Treasury](https://home.treasury.gov/) | Treasury securities and auctions | Public domain (US government work) |
| [USGS](https://www.usgs.gov/)                                                                | Gold supply until 2018           | Public domain (US government work) |

## Not used because of their terms

- [DefiLlama](https://defillama.com/terms): use only for personal, non-commercial purposes, no
  republishing of the data and no automated access.
- [Etherscan API](https://etherscan.io/apiterms): the free and smaller plans are for personal and
  research use only, not as a data feed.
- [DexScreener API](https://docs.dexscreener.com/api/api-terms-and-conditions): its data may not be made
  available to third parties.
- [Swissquote](https://www.swissquote.com/en/private/help/legal-tax/legal-information/important-legal-information):
  reproduction only for personal, non-commercial purposes.
- [World Gold Council](https://www.gold.org/terms-and-conditions): data only for personal,
  non-commercial use. Gold supply comes from USGS instead.
- [wbtc.network](https://wbtc.network/terms-of-service): no automated access and no republishing. WBTC
  custody comes from Chainlink's Proof of Reserves instead.
- [BlackRock](https://www.blackrock.com/corporate/compliance/terms-conditions): its terms do not allow
  automated collection of fund data. Circle's reserves come from Circle's reports. BUIDL is tracked
  with its supply on each chain, its holdings are not recorded until BlackRock allows it.
- [PublicNode](https://www.publicnode.com/terms): no automated data gathering.
- [dRPC](https://drpc.org/terms-of-use) public endpoints: its terms require an account.
- [Solana public RPC](https://solana.org/tos): the Solana Foundation's terms forbid systematic data
  collection from its services. Solana is read through a keyed RPC.
- [Ripple USD transparency reports](https://ripple.com/products/stablecoin/transparency/): monthly reserve
  reports of RLUSD. RLUSD is tracked with price and supply on Ethereum and the XRP Ledger, its
  backing is not recorded until Ripple allows it.
- [Agora attestations](https://developer.agora.finance/attestations): monthly reserve reports of AUSD.
  AUSD is tracked with price and supply and a generic icon, its backing is not recorded until Agora
  allows it.
- [J.P. Morgan Asset Management](https://am.jpmorgan.com/us/en/asset-management/institutional/terms-of-use/):
  its website content may not be copied or stored without consent. MONY is tracked with supply and a
  generic icon, its backing is not recorded.
- [Avant transparency page](https://app.avantprotocol.com/transparency): breakdown of the strategies
  behind avUSD. Its [terms](https://docs.avantprotocol.com/legal-and-risk/terms-of-use) do not allow
  automated access. avUSD is tracked with supply and a generic icon, its backing is not recorded until
  Avant allows it.
- [CFX Labs website](https://cfx.to/legal/terms-and-conditions): its terms allow informational,
  non-commercial use only. MOVEUSD is tracked with supply and a generic icon, its backing is not
  recorded until CFX allows it.
- [Saturn](https://saturn.credit/legal/terms-conditions): its terms do not allow automated access to
  its website and app or use of its marks without written permission. USDat is read on-chain only and
  has a generic icon.
- [Monad public RPCs](https://docs.monad.xyz/developer-essentials/network-information): the Monad
  Foundation's [terms](https://www.monad.xyz/terms-of-service) allow personal, non-commercial use of
  its websites and tools only. USDat on Monad is not tracked until Monad is read through a keyed RPC.
- [Arizore](https://arizore.io/terms-of-service): its terms do not allow automated collection of its
  reserve data.
- [Saga](https://saga.xyz/terms-of-service): its terms do not allow bots or applications that interact
  with its services without written consent, which covers the public SagaEVM RPC.
- [Spiko](https://www.spiko.io/): the terms of use of its website could not be read. USTBL is tracked
  with price and supply and a generic icon, its holdings are not recorded until Spiko allows it.
- [QuickNode](https://www.quicknode.com/terms) public endpoints: its terms require an account.
- [xStocks](https://xstocks.fi/documents/xstocks-terms-of-service.pdf): its terms do not allow automated
  collection or republishing of its proof of reserves. STRCx is tracked with its supply on each chain and
  a generic icon, its backing is not recorded until Backed Finance allows it.
