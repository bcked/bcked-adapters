/**
 * Circulating supply of xStocks, the tokenized shares issued by Backed Assets (JE) Limited.
 *
 * The issuer mints tokens ahead of demand and keeps them in its own wallets until they are issued.
 * Those wallets are listed in the issuer's public system wallets
 * (https://api.xstocks.fi/api/v2/public/system/wallets), and their balances are not circulating.
 * Tokens bridged with the xStocks bridge (Chainlink CCIP) are held by the bridge's pool or custody
 * account on the source chain and are not circulating there either.
 */
import { retry } from "../chains/evm";
import { ChainProxy } from "../chains/proxy";
import { SolanaChain } from "../chains/solana";
import { toISOString } from "../../utils/string_formatting";

const ISSUER_WALLETS: Record<"evm" | "solana", string[]> = {
    evm: [
        "0x5F7A4c11bde4f218f0025Ef444c369d838ffa2aD",
        "0xDFB7C32e55c43E28E2E1febbFcdA1e945f52f3b3",
        "0xDAab44B861F2768A57d49d7344EAf2FEd0B1317B",
        "0xBe0F93A8A46F756D9f16D90342C93B872793F90a",
        "0x0A934Bc9c64309C9654451f23D8331C2DAD34C2a",
    ],
    solana: [
        "S7vYFFWH6BjJyEsdrPQpqpYTqLTrPRK6KW3VwsJuRaS",
        "75kTRu9w6sThZsTCU36pmiQLSvm9feSePTeh8179oHmR",
        "HmMxmEjTbpGqgDsCCmgNfQKCbeH6QcGe1xKn9UXqXFqk",
        "7pt9tkctJPK7PPNQJ77GKg8ZffSF6QxoMiCFYHxrtaCj",
    ],
};

// The xStocks bridge pool on the EVM chains, the same address on each chain.
const EVM_BRIDGE = "0x9eC0e4A4c411493773E01e2ABF4D42395788846b";

const chain = new ChainProxy();
const solana = new SolanaChain();

/**
 * Supply of an xStock on one chain. Issued is the token's supply, circulating excludes the issuer's
 * wallets and the bridge. On Solana the mint's Scaled UI multiplier is applied, on EVM chains the
 * token's balances already include it.
 * @param custody The bridge's custody account of the token on Solana, if any.
 */
export async function xStockSupply(
    identifier: bcked.asset.Identifier,
    custody: string[] = []
): Promise<bcked.asset.Supply> {
    const { address, system } = identifier;
    if (system == "solana") {
        // Retried after a pause: Alchemy answers bursts with 429.
        const { issued, locked } = await retry(() =>
            solana.getScaledSupply(address, [...ISSUER_WALLETS.solana, ...custody])
        );
        return {
            timestamp: toISOString(Date.now()),
            circulating: issued - locked,
            burned: null,
            total: issued,
            issued,
            max: null,
        };
    }
    const [{ issued }, ...balances] = await Promise.all([
        chain.getSupply(address, system),
        ...[...ISSUER_WALLETS.evm, EVM_BRIDGE].map((holder) =>
            chain.getBalance(holder, address, system)
        ),
    ]);
    const locked = balances.reduce((sum, { balance }) => sum + balance, 0);
    return {
        timestamp: toISOString(Date.now()),
        circulating: issued - locked,
        burned: null,
        total: issued,
        issued,
        max: null,
    };
}
