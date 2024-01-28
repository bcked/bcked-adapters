import { hoursToMilliseconds } from "date-fns";
import path from "path";
import { readCSV } from "../../utils/csv";
import { distance, isNewer } from "../../utils/time";

const ASSETS_PATH = "assets";

export class ConsecutivePriceLookup {
    private readonly prices: Map<string, bcked.asset.Price> = new Map();
    private readonly csvStream: AsyncGenerator<bcked.asset.Price>;
    private done: boolean = false;
    private lastTimestamp: string | undefined = undefined;

    constructor(public readonly assetId: bcked.asset.Id) {
        const csvPath = path.join(ASSETS_PATH, assetId, "records", "price.csv");
        this.csvStream = readCSV<bcked.asset.Price>(csvPath);
    }

    public async getClosest(
        timestamp: string,
        window: number = hoursToMilliseconds(12)
    ): Promise<bcked.asset.Price | undefined> {
        // Read new prices from csvStream and store them in the prices map
        while (
            !this.done && // Stop if the csvStream is done
            (!this.lastTimestamp || !isNewer(timestamp, this.lastTimestamp, window)) // Read ahead the specified time window
        ) {
            const { value: price, done } = await this.csvStream.next();
            this.done = done!;

            if (!price) break;

            this.prices.set(price.timestamp, price);

            this.lastTimestamp = price.timestamp;
        }

        // Find the best match in the prices cache
        let bestMatch: bcked.asset.Price | undefined;
        let bestDistance: number | undefined;
        for (const price of this.prices.values()) {
            // Ignore and delete entries older than time window
            if (isNewer(price.timestamp, timestamp, window)) {
                this.prices.delete(price.timestamp);
                continue;
            }

            const timeDistance = distance(timestamp, price.timestamp);
            if (!bestDistance || timeDistance < bestDistance) {
                bestMatch = price;
                bestDistance = timeDistance;
            } else {
                break; // Prices are sorted, so we can stop here.
            }
        }

        return bestMatch;
    }
}
