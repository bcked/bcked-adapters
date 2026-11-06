import { describe, expect, it } from "bun:test";
import { toHex } from "./tron";

describe("toHex", () => {
    it("converts base58 Tron addresses", () => {
        // USDT on Tron, hex form as shown on tronscan.org.
        expect(toHex("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t")).toBe(
            "0xa614f803B6FD780986A42c78Ec9c7f77e6DeD13C"
        );
        expect(toHex("T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb")).toBe(
            "0x0000000000000000000000000000000000000000"
        );
    });

    it("rejects a bad checksum", () => {
        expect(() => toHex("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6u")).toThrow();
    });

    it("passes hex through", () => {
        expect(toHex("0xabc")).toBe("0xabc");
    });
});
