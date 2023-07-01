"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlLengthGrouping = void 0;
const array_1 = require("./array");
const URL_MAX_LENGTH = 2048;
function urlLengthGrouping(array, baseUrl, pathUrl) {
    return (0, array_1.groupWhile)(array, (group) => (baseUrl + pathUrl(group)).length <= URL_MAX_LENGTH);
}
exports.urlLengthGrouping = urlLengthGrouping;
//# sourceMappingURL=requests.js.map