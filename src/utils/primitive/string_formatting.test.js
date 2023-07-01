"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const string_formatting_1 = require("./string_formatting");
describe("String format test", () => {
    it("Replace a single placeholder with string.", () => {
        expect((0, string_formatting_1.format)("Test {test} test", { test: "hello" })).toBe("Test hello test");
    });
    it("Replace a multiple placeholders with strings.", () => {
        expect((0, string_formatting_1.format)("{start}Test {middle} test{end}", { start: "s", middle: "m", end: "e" })).toBe("sTest m teste");
    });
});
//# sourceMappingURL=string_formatting.test.js.map