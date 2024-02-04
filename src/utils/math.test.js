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
describe("test swap min max values in list", () => {
    it("example case", () => {
        const input = [8, 5, 30, 1, 70, 4];
        const expected = [5, 8, 4, 70, 1, 30];
        expect((0, math_1.inverse)(input)).toEqual(expected);
    });
});
//# sourceMappingURL=math.test.js.map