"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Etherscan = void 0;
/**
 * Provides an interface to the Etherscan API.
 * All attribution goes to the [Etherscan API](https://etherscan.io/apis).
 * For more details on the API check out the [API Documentation](https://docs.etherscan.io/api-endpoints/).
 */
const ethers_1 = require("ethers");
const requests_1 = require("../../utils/requests");
const string_formatting_1 = require("../../utils/string_formatting");
class Etherscan {
    constructor() {
        this.api = new requests_1.JsonApi(`https://api.etherscan.io`);
    }
    getUrl(module, action, options) {
        const opt = options ? "&" + (0, requests_1.joinOptions)(options) : "";
        return `/api?module=${module}&action=${action}${opt}&apikey=${process.env["ETHERSCAN_API_KEY"]}`;
    }
    async fetch(module, action, options) {
        const url = this.getUrl(module, action, options);
        const response = await this.api.fetchJson(url);
        if (response.status == "1") {
            return response.result;
        }
        else {
            throw new Error(`Failed to fetch module ${module} action ${action}: ${response.result}`);
        }
    }
    async getEthSupply() {
        const response = await this.fetch("stats", "ethsupply2");
        const burnedFees = ethers_1.BigNumber.from(response.BurntFees);
        const eth2Staking = ethers_1.BigNumber.from(response.Eth2Staking);
        const ethSupply = ethers_1.BigNumber.from(response.EthSupply);
        return {
            timestamp: (0, string_formatting_1.toISOString)(Date.now()),
            burned: parseFloat(ethers_1.utils.formatUnits(burnedFees, "ether")),
            issued: parseFloat(ethers_1.utils.formatUnits(ethSupply.add(eth2Staking), "ether")),
        };
    }
    async getEthPrice() {
        const ethPrice = await this.fetch("stats", "ethprice");
        return {
            timestamp: (0, string_formatting_1.toISOString)(parseInt(ethPrice.ethusd_timestamp) * 1000),
            usd: parseFloat(ethPrice.ethusd),
        };
    }
}
exports.Etherscan = Etherscan;
//# sourceMappingURL=etherscan.js.map