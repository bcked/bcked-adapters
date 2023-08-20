"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvApi = exports.JsonApi = exports.joinOptions = exports.urlLengthGrouping = void 0;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
const sync_1 = require("csv/sync");
const array_1 = require("./array");
const URL_MAX_LENGTH = 2048;
function urlLengthGrouping(array, baseUrl, pathUrl) {
    return (0, array_1.groupWhile)(array, (group) => (baseUrl + pathUrl(group)).length <= URL_MAX_LENGTH);
}
exports.urlLengthGrouping = urlLengthGrouping;
function joinOptions(options) {
    return Object.entries(options)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
}
exports.joinOptions = joinOptions;
class JsonApi {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.api = axios_1.default.create({ baseURL });
        (0, axios_retry_1.default)(this.api, { retryDelay: axios_retry_1.default.exponentialDelay });
    }
    async fetchJson(route) {
        return (await this.api.get(route, {
            headers: { accept: "application/json" },
        })).data;
    }
}
exports.JsonApi = JsonApi;
class CsvApi {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.api = axios_1.default.create({ baseURL });
        (0, axios_retry_1.default)(this.api, { retryDelay: axios_retry_1.default.exponentialDelay });
    }
    async fetchCsv(route, options) {
        const response = await this.api.get(route, {
            headers: { accept: ".csv" },
        });
        const csvString = response.data;
        if (csvString) {
            return (0, sync_1.parse)(csvString.trim(), options);
        }
        else {
            return undefined;
        }
    }
}
exports.CsvApi = CsvApi;
//# sourceMappingURL=requests.js.map