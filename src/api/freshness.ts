/**
 * Checks that the deployed API has recent data for every asset.
 * Exits with a non-zero code if a price, supply or backing is older than allowed, so a stopped
 * crawler or a missing attestation report shows up as a failed workflow run.
 *
 * Usage: bun src/api/freshness.ts [API base URL]
 */
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

interface Dated {
    date: string;
}

interface AssetSummary {
    id: string;
    symbol: string;
    system: string;
    backing: "reports" | "on-chain" | "custodian" | null;
    linkedEntities: { issuer?: string };
    price: Dated | null;
    supply: Dated | null;
    collateral: Dated | null;
}

const response = await fetch(`${base}/assets/summary/`);
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

for (const asset of assets) {
    // Added since the last crawl: no details, price or supply yet. The next crawl records them.
    if (asset.symbol == null) {
        console.log(`${asset.id}: not crawled yet, skipped`);
        continue;
    }
    if (!STATIC_PRICES(asset.id)) check(asset, "price", asset.price, MAX_AGE_DAYS);
    if (asset.system !== "rwa") check(asset, "supply", asset.supply, MAX_AGE_DAYS);
    const reportAge =
        asset.backing == "reports"
            ? MAX_REPORT_AGE_DAYS[asset.linkedEntities.issuer ?? ""]
            : undefined;
    if (reportAge !== undefined || asset.collateral)
        check(asset, "backing", asset.collateral, reportAge ?? MAX_AGE_DAYS);
}

if (problems.length) {
    console.error(`Found ${problems.length} outdated values:`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
}

console.log(`All ${assets.length} assets have recent data.`);
