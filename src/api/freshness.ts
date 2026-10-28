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
 * Backing that comes from reports is older by design. Allowed age in days: the report interval
 * plus the time until the report is published.
 */
const MAX_BACKING_AGE_DAYS: Record<string, number> = {
    // Paxos: monthly attestation reports
    "ethereum:0x45804880De22913dAFE09f4980848ECE6EcbAf78": 62, // PAXG
    "ethereum:0x4Fabb145d64652a948d72533023f6E7A623C7C53": 62, // BUSD
    // Tether: quarterly assurance reports
    "ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7": 140, // USDT
    // Circle: the cash on the transparency page is updated about weekly
    "ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": 10, // USDC
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
    if (!STATIC_PRICES(asset.id)) check(asset, "price", asset.price, MAX_AGE_DAYS);
    if (asset.system !== "rwa") check(asset, "supply", asset.supply, MAX_AGE_DAYS);
    const backingAge = MAX_BACKING_AGE_DAYS[asset.id];
    if (backingAge !== undefined || asset.collateral)
        check(asset, "backing", asset.collateral, backingAge ?? MAX_AGE_DAYS);
}

if (problems.length) {
    console.error(`Found ${problems.length} outdated values:`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
}

console.log(`All ${assets.length} assets have recent data.`);
