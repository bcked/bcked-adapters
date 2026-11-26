import { describe, expect, it } from "bun:test";
import { isRateLimit, suspension } from "./throttled";

const TRONGRID =
    'exceeded maximum retry limit (info={ "responseBody": "{\\"Error\\":\\"request credit rate exceeded the allowed_credit(300 credits\\\\/s), and the query server is suspended for 4 s.\\"}", "responseStatus": "599 CLIENT ESCALATED SERVER ERROR (429 Too Many Requests; exceeded maximum retry limit)" })';

describe("throttled provider", () => {
    it("recognizes TronGrid's rate limit and waits out its suspension", () => {
        const error = new Error(TRONGRID);
        expect(isRateLimit(error)).toBe(true);
        expect(suspension(error)).toBe(5000);
    });

    it("leaves other errors alone", () => {
        expect(isRateLimit(new Error("execution reverted"))).toBe(false);
        expect(suspension(new Error("429"))).toBe(6000);
    });
});
