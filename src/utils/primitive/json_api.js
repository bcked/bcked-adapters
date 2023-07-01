"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonApi = void 0;
const axios_1 = require("axios");
class JsonApi {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.api = axios_1.default.create({ baseURL });
    }
    async fetchJson(route) {
        return (await this.api.get(route, {
            headers: { accept: "application/json" },
        })).data;
    }
}
exports.JsonApi = JsonApi;
//# sourceMappingURL=json_api.js.map