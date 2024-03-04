declare namespace bcked {
    declare namespace asset {
        // The folder names in `./assets` are all AssetIds
        type Id = `${system.Id}:${Address}`;

        type Name = string;

        type Symbol = string;

        type Address = string;

        interface Identifier {
            address: Address; // Must be unique within the system. For cryptocurrencies this usually is contract address.
            system: system.Id; // The system in which the asset is issued. For cryptocurrencies this is the chain.
        }

        /**
         * An asset class groups similar investments into a category.
         *
         * _Note that the line between asset classes can get blurry and some asset classes overlap._
         *
         * **Asset Classes**
         *
         * - **Cryptocurrency**: Digital or virtual currencies that use cryptography for security. Examples: Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC).
         * - **Stock**: Ownership shares in a publicly traded company. Examples: Apple (AAPL), Amazon (AMZN), Google (GOOGL).
         * - **Equity**: Represents ownership in a company or investment fund. Examples: Common stock, preferred stock, equity mutual funds.
         * - **Fund**: Pools of money invested in various assets. Examples: Mutual funds, index funds, hedge funds.
         * - **Fixed-income security**: Investments that provide a fixed return over a specific period. Examples: Bonds, Treasury bills, certificates of deposit (CDs).
         * - **Cash**: Physical currency or money held in bank accounts. Examples: Banknotes, coins, checking accounts.
         * - **Cash equivalent**: Short-term investments that can be quickly converted to cash. Examples: Money market funds, Treasury bills.
         * - **Fiat money**: Government-issued currency that is not backed by a physical commodity. Examples: US Dollar (USD), Euro (EUR), Japanese Yen (JPY).
         * - **Real estate**: Property or land and the buildings on it. Examples: Residential homes, commercial buildings, undeveloped land.
         * - **Tangible asset**: Physical assets with inherent value. Examples: Gold, silver, artwork, collectibles.
         * - **Derivative**: Financial contracts whose value is derived from an underlying asset. Examples: Options, futures, swaps.
         * - **Commodity**: Raw materials or primary agricultural products. Examples: Crude oil, gold, wheat.
         *
         * **References**
         *
         * - https://tokenist.com/investing/asset-classes/
         */
        type Class =
            | "cryptocurrency"
            | "stock"
            | "equity"
            | "fund"
            | "fixed-income-security"
            | "cash"
            | "cash-equivalent"
            | "fiat-money"
            | "real-estate"
            | "tangible-asset"
            | "derivative"
            | "commodity";

        /**
         * A tag describes some property of an asset.
         *
         * _Note that this list is not comprehensive and can be extended when needed._
         *
         * **Tags**
         *
         * - **Bridged asset**: An asset that has been transferred or replicated from one blockchain or network to another, typically facilitated by a bridging mechanism or technology.
         * - **LP token**: A token representing ownership in a decentralized finance (DeFi) liquidity pool, entitling holders to a proportional share of the pool's liquidity and associated fees.
         * - **Staking token**: A token that signifies a user's ownership and participation in a network or protocol, used for staking, securing the blockchain, and earning rewards.
         * - **Wrapped token**: A tokenized version of an asset.
         * - **Governance token**: A token that grants holders the right to participate in the decision-making processes and governance of a decentralized protocol or platform.
         * - **Utility token**: A token designed to have specific utility or functionality within a blockchain ecosystem, often used to access products or services offered by the platform.
         * - **IOU (I owe you) token**: Represents a claim or promise to deliver a specific asset or value at a later time, acting as a placeholder until the asset is delivered or made available.
         * - **Real world asset**: Represents ownership or fractional ownership of physical assets, such as real estate, commodities, or other tangible assets, that are tokenized on a blockchain.
         * - **Chain token**: The native currency or token specific to a blockchain or network, often utilized for transaction fees, governance, or as a medium of exchange within the ecosystem.
         * - **Stablecoin**: A cryptocurrency designed to maintain a stable value by being pegged to a reserve asset or following a predetermined algorithm, reducing price volatility.
         * - **Inflationary token**: A token that has an inflationary monetary policy, where new tokens are continuously minted or issued over time, potentially leading to a decrease in purchasing power.
         * - **Deflationary token**: A token that has a deflationary monetary policy, where the total supply of tokens decreases over time, often through mechanisms such as token burning.
         * - **Index token**: A token representing ownership or participation in an index that tracks the performance of a market or specific sector, providing exposure to a diversified portfolio of assets.
         * - **Flatcoin**: A flatcoin is a cryptocurrency pegged to the price of living.
         */
        type Tag =
            | "bridged-asset"
            | "lp-token"
            | "staking-token"
            | "wrapped-token"
            | "governance-token"
            | "utility-token"
            | "iou-token"
            | "real-world-asset"
            | "chain-token"
            | "stablecoin"
            | "inflationary-token"
            | "deflationary-token"
            | "index-token"
            | "flatcoin";

        interface Details {
            name: Name;
            symbol: bcked.asset.Symbol;
            identifier: Identifier;
            assetClasses: Class[];
            linkedEntities: Partial<Record<entity.Role, entity.Id>>;
            reference: primitive.URL | null; // If unknown, this must be set to null.
            tags: Tag[];
        }

        type DetailsRecord = Details & {
            listed: primitive.ISODateTimeString;
            updated: primitive.ISODateTimeString;
        };

        interface Price {
            timestamp: primitive.ISODateTimeString;
            usd: number;
        }

        interface Supply {
            timestamp: primitive.ISODateTimeString;
            circulating: number | null; // Circulating = Issued - Locked - Burned; If unknown, this must be set to null.
            burned: number | null; // If unknown, this must be set to null.
            total: number | null; // Total = Circulating + Locked = Issued - Burned; If unknown, this must be set to null.
            issued: number | null; // If unknown, this must be set to null.
            max: number | null; // Maximum number of supply; If unknown or N/A, this must be set to null.
        }

        type SupplyAmount = Supply & { amount: number };

        interface Backing {
            timestamp: primitive.ISODateTimeString;
            underlying: Partial<Record<Id, number>>;
        }

        // Generated from supply and price data
        interface MarketCap {
            timestamp: primitive.ISODateTimeString;
            price: Price;
            supply: SupplyAmount;
            usd: number;
        }

        // Generated from backing and price data to cover underlying and derivative assets
        interface Relationship {
            amount: number;
            price?: Price;
            usd?: number;
        }

        // Generated from backing and price data to cover underlying and derivative assets
        interface Relationships {
            timestamp: primitive.ISODateTimeString;
            usd: number;
            breakdown: Record<bcked.asset.Id, Relationship>;
        }

        // Generated from market cap and underlying assets data
        interface Collateralization {
            timestamp: primitive.ISODateTimeString;
            market_cap: MarketCap;
            collateral: Relationships;
            ratio: number;
        }

        interface Graph {
            timestamp: primitive.ISODateTimeString;
            graph: graph.Graph;
            stats: graph.Stats;
        }

        interface Adapter {
            getDetails(lastRecorded: DetailsRecord | null): Promise<Details>;
            getPrice(lastRecorded: Price | null): Promise<Price[]>;
            getSupply(lastRecorded: Supply | null): Promise<Supply[]>;
            getBacking(lastRecorded: Backing | null): Promise<Backing[]>;
        }
    }

    declare namespace system {
        // The folder names in `./systems` are all system.Ids
        type Id = string;

        interface Details {
            name: string;
            native: bcked.asset.Address | null;
            explorer: string | null; // Webpage where one can look up an asset within the system. If not available, this must be set to null.
        }

        type DetailsRecord = Details & {
            listed: primitive.ISODateTimeString;
            updated: primitive.ISODateTimeString;
        };

        interface TotalValueLocked {
            timestamp: primitive.ISODateTimeString;
            totalValueLocked: number;
        }

        interface Adapter {
            getDetails(lastRecorded: DetailsRecord | null): Promise<Details>;
            // Generic method to update any type of entity related data.
            update(): Promise<void>;
        }
    }

    declare namespace entity {
        // The folder names in `./entities` are all entity.Ids
        type Id = string;

        /**
         *  An entity can hold a specific role in relation to an asset.
         *
         * _Note that the following roles do not refer to any legally defined term._
         *
         * **Roles**
         *
         * - **Issuer**: An entity that creates and offers an asset to the market. The issuer is responsible for issuing and distributing the asset to investors or buyers. They may also be responsible for setting the terms and conditions associated with the asset issuance. In the context of blockchain and cryptocurrency, the issuer might simply refer to the deployer.
         * - **Protocol**: An entity that establishes the rules, standards, and framework for a particular asset class or ecosystem. In the context of blockchain and cryptocurrency, a protocol refers to the underlying technology or network that governs the creation, transfer, and validation of digital assets. It defines the consensus mechanism, transaction rules, and overall functionality of the asset class.
         */
        type Role = "issuer" | "protocol";

        /**
         * A tag describes some property of an entity e.g. a specific service this entity provides.
         *
         * _Note that this list is not comprehensive and can be extended when needed._
         *
         * **Tags**
         *
         * - **Cross-chain bridge provider**: Describes an entity or technology that enables interoperability between different blockchain networks, facilitating seamless asset or data transfer.
         * - **Decentralized exchange (DEX)**: Refers to an entity or platform that enables peer-to-peer trading of cryptocurrencies and digital assets without relying on intermediaries or centralized control.
         * - **Centralized exchange (CEX)**: Represents a centralized entity or platform that facilitates the trading of cryptocurrencies and digital assets, typically providing order matching, liquidity, and custody services.
         * - **Blockchain network operator**: Describes an entity or organization responsible for operating and maintaining a blockchain network, validating transactions, securing the network, and implementing consensus mechanisms.
         * - **Oracle provider**: Describes an entity or service that provides real-world data feeds or information to smart contracts on a blockchain.
         * - **Decentralized autonomous organization (DAO)**: Refers to an entity or organization that operates on a blockchain network and is governed by smart contracts and consensus mechanisms, enabling decentralized decision-making and management.
         * - **Bank**: Describes a financial institution that provides various financial services, such as accepting deposits, facilitating payments, offering loans, and managing investments.
         * - **Central bank**: Refers to a specific type of bank that typically operates at the national level and is responsible for implementing monetary policies, regulating the country's currency, and overseeing the overall financial system.
         */
        type Tag =
            | "bridge-provider"
            | "dex"
            | "cex"
            | "chain-operator"
            | "oracle-provider"
            | "dao"
            | "bank"
            | "central-bank"
            | "treasury";

        interface Details {
            name: string;
            identifier: Id;
            reference: string;
            tags: Tag[];
        }

        type DetailsRecord = Details & {
            listed: primitive.ISODateTimeString;
            updated: primitive.ISODateTimeString;
        };

        interface TotalValueLocked {
            timestamp: primitive.ISODateTimeString;
            totalValueLocked: number;
        }

        interface Adapter {
            getDetails(lastRecorded: DetailsRecord | null): Promise<Details>;
            // Generic method to update any type of entity related data.
            update(): Promise<void>;
        }
    }

    declare namespace query {
        interface Balance {
            timestamp: primitive.ISODateTimeString;
            balance: number;
        }
        interface Decimals {
            timestamp: primitive.ISODateTimeString;
            decimals: number;
        }
        interface Supply {
            timestamp: primitive.ISODateTimeString;
            burned: number | null;
            issued: number;
        }

        interface ChainModule {
            getBalance(
                address: string,
                token: bcked.asset.Address | null, // Null if balance of "chain native" is requested (no ERC20 contract)
                system: bcked.system.Id
            ): Promise<Balance>;
            getSupply(token: bcked.asset.Address, system: bcked.system.Id): Promise<Supply>;
            getDecimals(token: bcked.asset.Address, system: bcked.system.Id): Promise<Decimals>;
        }

        interface ApiModule {
            getPrices(
                identifiers: bcked.asset.Identifier[]
            ): Promise<Partial<Record<bcked.asset.Id, bcked.asset.Price>>>;
            getPrice(identifier: bcked.asset.Identifier): Promise<bcked.asset.Price | undefined>;
        }
    }
}
