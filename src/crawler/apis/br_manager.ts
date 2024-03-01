/**
 * Provides an interface to BlackRock data.
 * All attribution goes to the BlackRock.
 */
import path from "path";
import { CsvApi, joinOptions } from "../../utils/requests";

const descriptionAssetMapping: Record<string, bcked.asset.Id> = {
    "WI TREASURY BILL": "rwa:USTB-WI",
    "TREASURY BILL": "rwa:USTB",
    "WI TREASURY NOTE": "rwa:USTNOTE-WI",
    "TREASURY NOTE": "rwa:USTNOTE",
    "WI TREASURY BOND": "rwa:USTBOND-WI",
    "TREASURY BOND": "rwa:USTBOND",
    "TRI-PARTY": "rwa:USTrepo",
    TREASURY: "rwa:USTB",
};

export interface Options {
    fileType: "csv"; // extend by other possible types when known
    fileName: string;
    dataType: "fund"; // extend by other possible types when known
    asOfDate: string; // yyyymmdd
}

type BRDate = `${number}-${string}-${number}`; // dd-mmm-yyyy e.g. 10-Jul-2023

interface PositionCsv {
    "Position Description": string;
    "%Par": string;
    Par: string;
    Identifier: string;
    "Yield/Coupon": string;
    Final: BRDate;
    Exchange: string;
    "Maturity/Reset": BRDate;
}

export interface Position {
    identifier: string;
    asset: bcked.asset.Id;
    description: string;
    exchange: string;
    par: number;
    par_percent: string;
    yield_coupon: string;
    final: BRDate;
    maturity_reset: BRDate;
}

export class BRManager {
    api: CsvApi;

    constructor() {
        this.api = new CsvApi("https://www.blackrock.com");
    }

    private getProductUrl(product: string): string {
        return `/cash/en-us/products/${product}`;
    }

    private getFundUrl(product: string, fund: string, options: Options): string {
        return path.join(this.getProductUrl(product), `fund/${fund}.ajax?${joinOptions(options)}`);
    }

    private mapAsset(description: string): bcked.asset.Id {
        for (const [keyword, asset] of Object.entries(descriptionAssetMapping)) {
            if (description.toLowerCase().startsWith(keyword.toLowerCase())) {
                return asset;
            }
        }
        return "rwa:undefined";
    }

    async getPositions(
        product: string,
        fund: string,
        options: Options
    ): Promise<Position[] | null> {
        const url = this.getFundUrl(product, fund, options);

        const positions = await this.api.fetchCsv<PositionCsv[]>(url, {
            columns: true,
            from_line: 3,
            skip_empty_lines: true,
            skip_records_with_error: true,
        });

        if (!positions?.length) return null;

        return positions.map((value) => ({
            identifier: value.Identifier,
            asset: this.mapAsset(value["Position Description"]),
            description: value["Position Description"],
            exchange: value.Exchange,
            par: parseFloat(value.Par.replaceAll(",", "")),
            par_percent: value["%Par"],
            yield_coupon: value["Yield/Coupon"],
            final: value.Final,
            maturity_reset: value["Maturity/Reset"],
        }));
    }
}
