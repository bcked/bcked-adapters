/**
 * ETH supply from ultrasound.money (https://ultrasound.money), which computes it from the
 * execution and consensus layers. The site publishes no terms of use.
 */
import { JsonApi } from "../../utils/requests";
import { toISOString } from "../../utils/string_formatting";

interface SupplyOverTime {
    d1: { supply: number; timestamp: string }[];
}

export class Ultrasound {
    api = new JsonApi("https://ultrasound.money");

    /** The latest ETH supply. */
    async getEthSupply(): Promise<{ timestamp: primitive.ISODateTimeString; supply: number }> {
        const { d1 } = await this.api.fetchJson<SupplyOverTime>("/api/v2/fees/supply-over-time");
        const latest = d1.at(-1);
        if (!latest) throw Error("ultrasound.money returned no ETH supply.");
        return { timestamp: toISOString(latest.timestamp), supply: latest.supply };
    }
}
