import type { AxiosInstance } from "axios";
import Axios from "axios";
import axiosRetry from "axios-retry";
import { type Options } from "csv-parse";
import { parse as parseSync } from "csv/sync";
import { groupWhile } from "./array";

const URL_MAX_LENGTH = 2048;

export function urlLengthGrouping<T>(array: T[], baseUrl: string, pathUrl: (group: T[]) => string) {
    return groupWhile(array, (group) => (baseUrl + pathUrl(group)).length <= URL_MAX_LENGTH);
}

export function joinOptions(options: object | Record<string, string>): string {
    return Object.entries(options)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
}

export class JsonApi {
    private api: AxiosInstance;
    constructor(public baseURL: string) {
        this.api = Axios.create({ baseURL });
        axiosRetry(this.api, { retryDelay: axiosRetry.exponentialDelay });
    }

    public async fetchJson<T>(route: string): Promise<T> {
        return (
            await this.api.get(route, {
                headers: { accept: "application/json" },
            })
        ).data;
    }
}

export class CsvApi {
    private api: AxiosInstance;
    constructor(public baseURL: string) {
        this.api = Axios.create({ baseURL });
        axiosRetry(this.api, { retryDelay: axiosRetry.exponentialDelay });
    }

    public async fetchCsv<T>(route: string, options?: Options): Promise<T | undefined> {
        const response = await this.api.get(route, {
            headers: { accept: ".csv" },
        });
        const csvString = response.data;
        if (csvString) {
            return parseSync(csvString.trim(), options);
        } else {
            return undefined;
        }
    }
}
