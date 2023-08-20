"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("./math");
describe("rate calculation test", () => {
    it("decrease of 20%", () => {
        expect((0, math_1.rate)(100, 80)).toBe(-0.2);
    });
    it("increase of 20%", () => {
        expect((0, math_1.rate)(100, 120)).toBe(0.2);
    });
});
//# sourceMappingURL=math.test.js.map