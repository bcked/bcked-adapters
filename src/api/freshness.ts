/**
 * Checks that the deployed API has recent data for every asset.
 * Exits with a non-zero code if a price, supply or backing is older than allowed, so a stopped
 * crawler or a missing attestation report shows up as a failed workflow run.
 *
 * Usage: bun src/api/freshness.ts [API base URL]
 */
import { PRICE_SOURCES } from "../crawler/apis/chainlink";
import { NO_SUPPLY } from "../constants";

const base = process.argv[2] ?? "https://api.bcked.com";

const DAY = 24 * 60 * 60 * 1000;
const MAX_AGE_DAYS = 3;

/**
 * Backing that comes from reports is older by design. Allowed age in days per issuer: the report
 * interval plus the time until the report is published. Applies to all its tokens on every chain.
 */
const MAX_REPORT_AGE_DAYS: Record<string, number> = {
    paxos: 62, // monthly attestation reports (PAXG, BUSD)
    circle: 62, // monthly attestation reports, published weeks after the dates they cover (USDC)
    tether: 140, // quarterly reports (USDT, XAUT)
};

/** Assets whose price is constant or never crawled. */
const STATIC_PRICES = (id: string) => id.startsWith("rwa:") && id !== "rwa:XAU";
// Only assets with a price source (a Chainlink feed) get a current price. Others, like a fund without
// a feed or a token whose feed ended, have no price and so no backing ratio.
const NO_PRICE = { has: (id: string) => !(id in PRICE_SOURCES) };

interface Dated {
    date: string;
}

interface AssetSummary {
    id: string;
    symbol: string;
    system: string;
    backing: "reports" | "on-chain" | "custodian" | "not-tracked" | null;
    token?: string;
    linkedEntities: { issuer?: string };
    price: Dated | null;
    supply: Dated | null;
    collateral: Dated | null;
}

// GitHub Pages serves cached copies for a few minutes after a deploy. A unique query string skips
// the cache, so the check sees the summary that was just deployed.
const response = await fetch(`${base}/assets/summary/?t=${Date.now()}`, { cache: "no-store" });
if (!response.ok) throw new Error(`${base}/assets/summary/ returned ${response.status}`);
const { assets } = (await response.json()) as { assets: AssetSummary[] };

const now = Date.now();
const problems: string[] = [];

function check(asset: AssetSummary, field: string, value: Dated | null, maxDays: number): void {
    if (!value) {
        problems.push(`${asset.symbol} (${asset.id}): no ${field}`);
        return;
    }
    const age = (now - Date.parse(value.date)) / DAY;
    if (age > maxDays + 1)
        problems.push(
            `${asset.symbol} (${asset.id}): ${field} from ${value.date} is ${Math.floor(age)} days old (allowed ${maxDays})`
        );
}

// Latest backing of each token on any chain. All chains of a token share the same reports.
const latestByToken = new Map<string, string>();
for (const asset of assets) {
    if (!asset.token || !asset.collateral) continue;
    const latest = latestByToken.get(asset.token);
    if (!latest || asset.collateral.date > latest)
        latestByToken.set(asset.token, asset.collateral.date);
}

for (const asset of assets) {
    // Added since the last crawl: no details, price or supply yet. The next crawl records them.
    if (asset.symbol == null) {
        console.log(`${asset.id}: not crawled yet, skipped`);
        continue;
    }
    if (!STATIC_PRICES(asset.id) && !NO_PRICE.has(asset.id))
        check(asset, "price", asset.price, MAX_AGE_DAYS);
    if (asset.system !== "rwa" && !NO_SUPPLY.has(asset.id))
        check(asset, "supply", asset.supply, MAX_AGE_DAYS);
    const reportAge =
        asset.backing == "reports"
            ? MAX_REPORT_AGE_DAYS[asset.linkedEntities.issuer ?? ""]
            : undefined;
    // The backing check reads the backing ratio, which needs a price. The chain assets of a token
    // get a ratio only where their supply is known at a report date, so some chains get a ratio
    // from the next report.
    if (asset.backing == "not-tracked") {
        // No backing is recorded on purpose, the details say why.
    } else if (asset.token && !asset.collateral) {
        console.log(
            `${asset.symbol} (${asset.id}): no backing ratio yet, waits for the next report`
        );
    } else if (
        asset.token &&
        asset.collateral &&
        reportAge !== undefined &&
        (now - Date.parse(asset.collateral.date)) / DAY > reportAge + 1 &&
        (now - Date.parse(latestByToken.get(asset.token)!)) / DAY <= reportAge + 1
    ) {
        // Another chain of the token has a current report, so the reports are fresh. This chain
        // has no supply recorded at the newer report dates yet (USDC on Solana before 2026-11).
        console.log(
            `${asset.symbol} (${asset.id}): backing from ${asset.collateral.date}, newer reports have no supply for this chain yet`
        );
    } else if (!NO_PRICE.has(asset.id) && (reportAge !== undefined || asset.collateral))
        check(asset, "backing", asset.collateral, reportAge ?? MAX_AGE_DAYS);
}

if (problems.length) {
    console.error(`Found ${problems.length} outdated values:`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
}

console.log(`All ${assets.length} assets have recent data.`);
