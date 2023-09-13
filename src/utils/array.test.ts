import {
    closest,
    fromAsync,
    generate,
    matchOnTimestamp,
    readTimeSeries,
    relativeInMs,
    toAsync,
} from "./array";

describe("closest", () => {
    const mockData = [
        { timestamp: "2022-04-08T00:00:00.000Z" },
        { timestamp: "2022-04-09T00:00:00.000Z" },
        { timestamp: "2022-04-10T00:00:00.000Z" },
    ];

    it("returns the exact item for the timestamp", () => {
        expect(closest(mockData, "2022-04-08T00:00:00.000Z")).toEqual({
            timestamp: "2022-04-08T00:00:00.000Z",
        });
        expect(closest(mockData, "2022-04-09T00:00:00.000Z")).toEqual({
            timestamp: "2022-04-09T00:00:00.000Z",
        });
        expect(closest(mockData, "2022-04-10T00:00:00.000Z")).toEqual({
            timestamp: "2022-04-10T00:00:00.000Z",
        });
    });

    it("returns the closest timestamp in the array", () => {
        expect(closest(mockData, "2022-04-08T12:00:00.000Z")).toEqual({
            timestamp: "2022-04-08T00:00:00.000Z",
        });
        expect(closest(mockData, "2022-04-09T12:00:00.000Z")).toEqual({
            timestamp: "2022-04-09T00:00:00.000Z",
        });
        expect(closest(mockData, "2022-04-10T12:00:00.000Z")).toEqual({
            timestamp: "2022-04-10T00:00:00.000Z",
        });
    });

    it("returns the first item in the array if the timestamp is before the first item", () => {
        expect(closest(mockData, "2022-04-07T12:00:00.000Z")).toEqual({
            timestamp: "2022-04-08T00:00:00.000Z",
        });
    });

    it("returns the last item in the array if the timestamp is after the last item", () => {
        expect(closest(mockData, "2022-04-11T12:00:00.000Z")).toEqual({
            timestamp: "2022-04-10T00:00:00.000Z",
        });
    });
});

describe("relativeInMs", () => {
    const mockData = [
        { timestamp: "2022-04-08T00:00:00.000Z" },
        { timestamp: "2022-04-09T00:00:00.000Z" },
        { timestamp: "2022-04-10T00:00:00.000Z" },
    ];

    it("returns the closest timestamp within small deviation from the relative time", () => {
        const interval = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        const deviation = 0.01; // 1%

        // Test with a timestamp exactly 1 day before the latest timestamp
        const result1 = relativeInMs(mockData, interval, deviation);
        expect(result1).toEqual({ timestamp: "2022-04-09T00:00:00.000Z" });

        // Test with a timestamp exactly 2 days before the latest timestamp
        const result2 = relativeInMs(mockData, interval * 2, deviation);
        expect(result2).toEqual({ timestamp: "2022-04-08T00:00:00.000Z" });

        // Test with a timestamp exactly 3 days before the latest timestamp
        const result3 = relativeInMs(mockData, interval * 3, deviation);
        expect(result3).toEqual(undefined);
    });

    it("returns the closest timestamp within small deviation from the relative time", () => {
        const interval = 24 * 60 * 60 * 1000; // 1 day in milliseconds

        // Test with a timestamp exactly 3 days before the latest timestamp
        const result3 = relativeInMs(mockData, interval * 3, 1 / 3);
        expect(result3).toEqual({ timestamp: "2022-04-08T00:00:00.000Z" });
    });

    it("returns undefined if the array is empty", () => {
        expect(relativeInMs([], 0, 0)).toEqual(undefined);
    });

    it("returns undefined if there is no timestamp within deviation from the relative time", () => {
        const interval = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        const deviation = 0.01; // 1 second in milliseconds

        // Test with a timestamp exactly 4 days before the latest timestamp
        const result1 = relativeInMs(mockData, interval * 4, deviation);
        expect(result1).toEqual(undefined);

        // Test with a timestamp exactly 5 days before the latest timestamp
        const result2 = relativeInMs(mockData, interval * 5, deviation);
        expect(result2).toEqual(undefined);
    });
});

describe("generate test", () => {
    it("generate array with 10 numbers and expect array length of 10", () => {
        expect(generate(0, 1, 10).length).toBe(10);
    });
});

describe("async array test", () => {
    it("roundtrip", async () => {
        const expected = [1, 2, 3, 4, undefined, null];
        expect(await fromAsync(toAsync(expected))).toEqual(expected);
    });
});

describe("test read time series", () => {
    // Define the possible element types
    type ListElement1 = { timestamp: primitive.ISODateTimeString; value1: number };
    type ListElement2 = { timestamp: primitive.ISODateTimeString; value2: number };

    // Create a union type that represents all possible element types
    type ListElement = ListElement1 | ListElement2;

    type TimeSeriesItem<T> = { index: number; item: T };

    it("Read with equal time resolution", async () => {
        const l1e1: ListElement1 = { timestamp: "2023-09-09T12:00:00.000Z", value1: 11 };
        const l1e2: ListElement1 = { timestamp: "2023-09-10T12:00:00.000Z", value1: 12 };
        const l1e3: ListElement1 = { timestamp: "2023-09-11T12:00:00.000Z", value1: 13 };
        const l1e4: ListElement1 = { timestamp: "2023-09-12T12:00:00.000Z", value1: 14 };
        const l1e5: ListElement1 = { timestamp: "2023-09-13T12:00:00.000Z", value1: 15 };
        const l2e1: ListElement2 = { timestamp: "2023-09-09T12:00:00.000Z", value2: 21 };
        const l2e2: ListElement2 = { timestamp: "2023-09-10T12:00:00.000Z", value2: 22 };
        const l2e3: ListElement2 = { timestamp: "2023-09-11T12:00:00.000Z", value2: 23 };
        const l2e4: ListElement2 = { timestamp: "2023-09-12T12:00:00.000Z", value2: 24 };
        const l2e5: ListElement2 = { timestamp: "2023-09-13T12:00:00.000Z", value2: 25 };

        const expected: TimeSeriesItem<ListElement>[] = [
            { index: 0, item: l1e1 },
            { index: 1, item: l2e1 },
            { index: 0, item: l1e2 },
            { index: 1, item: l2e2 },
            { index: 0, item: l1e3 },
            { index: 1, item: l2e3 },
            { index: 0, item: l1e4 },
            { index: 1, item: l2e4 },
            { index: 0, item: l1e5 },
            { index: 1, item: l2e5 },
        ];
        const input = [
            [l1e1, l1e2, l1e3, l1e4, l1e5],
            [l2e1, l2e2, l2e3, l2e4, l2e5],
        ].map(toAsync<ListElement>);

        const matched = await fromAsync(readTimeSeries(input));

        expect(matched).toEqual(expected);
    });

    it("Read with different time resolution", async () => {
        const l1e1: ListElement1 = { timestamp: "2023-09-09T12:00:00.000Z", value1: 11 };
        const l1e2: ListElement1 = { timestamp: "2023-09-10T12:00:00.000Z", value1: 12 };
        const l1e3: ListElement1 = { timestamp: "2023-09-11T12:00:00.000Z", value1: 13 };
        const l1e4: ListElement1 = { timestamp: "2023-09-12T12:00:00.000Z", value1: 14 };
        const l1e5: ListElement1 = { timestamp: "2023-09-13T12:00:00.000Z", value1: 15 };
        const l2e1: ListElement2 = { timestamp: "2023-09-09T12:00:00.000Z", value2: 21 };
        const l2e2: ListElement2 = { timestamp: "2023-09-09T13:00:00.000Z", value2: 22 };
        const l2e3: ListElement2 = { timestamp: "2023-09-09T14:00:00.000Z", value2: 23 };
        const l2e4: ListElement2 = { timestamp: "2023-09-09T15:00:00.000Z", value2: 24 };
        const l2e5: ListElement2 = { timestamp: "2023-09-09T16:00:00.000Z", value2: 25 };
        const l2e6: ListElement2 = { timestamp: "2023-09-09T17:00:00.000Z", value2: 26 };
        const l2e7: ListElement2 = { timestamp: "2023-09-09T18:00:00.000Z", value2: 27 };
        const l2e8: ListElement2 = { timestamp: "2023-09-09T19:00:00.000Z", value2: 28 };
        const l2e9: ListElement2 = { timestamp: "2023-09-09T20:00:00.000Z", value2: 29 };

        const expected: TimeSeriesItem<ListElement>[] = [
            { index: 0, item: l1e1 },
            { index: 1, item: l2e1 },
            { index: 0, item: l1e2 },
            { index: 1, item: l2e2 },
            { index: 0, item: l1e3 },
            { index: 1, item: l2e3 },
            { index: 1, item: l2e4 },
            { index: 1, item: l2e5 },
            { index: 0, item: l1e4 },
            { index: 1, item: l2e6 },
            { index: 1, item: l2e7 },
            { index: 1, item: l2e8 },
            { index: 1, item: l2e9 },
            { index: 0, item: l1e5 },
        ];
        const input = [
            [l1e1, l1e2, l1e3, l1e4, l1e5],
            [l2e1, l2e2, l2e3, l2e4, l2e5, l2e6, l2e7, l2e8, l2e9],
        ].map(toAsync<ListElement>);

        const matched = await fromAsync(readTimeSeries(input, 0.9));

        expect(matched).toEqual(expected);
    });

    it("Read with different time resolution and direct adaption", async () => {
        const l1e1: ListElement1 = { timestamp: "2023-09-09T12:00:00.000Z", value1: 11 };
        const l1e2: ListElement1 = { timestamp: "2023-09-10T12:00:00.000Z", value1: 12 };
        const l1e3: ListElement1 = { timestamp: "2023-09-11T12:00:00.000Z", value1: 13 };
        const l1e4: ListElement1 = { timestamp: "2023-09-12T12:00:00.000Z", value1: 14 };
        const l1e5: ListElement1 = { timestamp: "2023-09-13T12:00:00.000Z", value1: 15 };
        const l2e1: ListElement2 = { timestamp: "2023-09-09T12:00:00.000Z", value2: 21 };
        const l2e2: ListElement2 = { timestamp: "2023-09-09T13:00:00.000Z", value2: 22 };
        const l2e3: ListElement2 = { timestamp: "2023-09-09T14:00:00.000Z", value2: 23 };
        const l2e4: ListElement2 = { timestamp: "2023-09-09T15:00:00.000Z", value2: 24 };
        const l2e5: ListElement2 = { timestamp: "2023-09-09T16:00:00.000Z", value2: 25 };
        const l2e6: ListElement2 = { timestamp: "2023-09-09T17:00:00.000Z", value2: 26 };
        const l2e7: ListElement2 = { timestamp: "2023-09-09T18:00:00.000Z", value2: 27 };
        const l2e8: ListElement2 = { timestamp: "2023-09-09T19:00:00.000Z", value2: 28 };
        const l2e9: ListElement2 = { timestamp: "2023-09-09T20:00:00.000Z", value2: 29 };

        const expected: TimeSeriesItem<ListElement>[] = [
            { index: 0, item: l1e1 },
            { index: 1, item: l2e1 },
            { index: 0, item: l1e2 },
            { index: 1, item: l2e2 },
            { index: 0, item: l1e3 },
            { index: 1, item: l2e3 },
            { index: 1, item: l2e4 },
            { index: 1, item: l2e5 },
            { index: 1, item: l2e6 },
            { index: 1, item: l2e7 },
            { index: 1, item: l2e8 },
            { index: 1, item: l2e9 },
            { index: 0, item: l1e4 },
            { index: 0, item: l1e5 },
        ];
        const input = [
            [l1e1, l1e2, l1e3, l1e4, l1e5],
            [l2e1, l2e2, l2e3, l2e4, l2e5, l2e6, l2e7, l2e8, l2e9],
        ].map(toAsync<ListElement>);

        const matched = await fromAsync(readTimeSeries(input, 0.0));

        expect(matched).toEqual(expected);
    });
});

describe("test match on timestamp", () => {
    // Define the possible element types
    type ListElement1 = { timestamp: primitive.ISODateTimeString; value1: number };
    type ListElement2 = { timestamp: primitive.ISODateTimeString; value2: number };
    type ListElement3 = { timestamp: primitive.ISODateTimeString; value3: number };

    // Create a union type that represents all possible element types
    type ListElement = ListElement1 | ListElement2 | ListElement3;

    it("Match with equal timestamps", async () => {
        const l1e1: ListElement1 = { timestamp: "2023-09-09T12:30:00.000Z", value1: 11 };
        const l2e1: ListElement2 = { timestamp: "2023-09-09T12:30:00.000Z", value2: 21 };
        const l3e1: ListElement3 = { timestamp: "2023-09-09T12:30:00.000Z", value3: 31 };

        const expected: Array<ListElement[]> = [[l1e1, l2e1, l3e1]];
        const input = [[l1e1], [l2e1], [l3e1]].map(toAsync<ListElement>);

        const matched = await fromAsync(matchOnTimestamp(input));

        expect(matched).toEqual(expected);
    });

    it("No match with timestamp older than 12h", async () => {
        const l1e1: ListElement1 = { timestamp: "2023-09-09T12:30:00.000Z", value1: 11 };
        const l2e1: ListElement2 = { timestamp: "2023-09-09T00:00:00.000Z", value2: 21 };
        const l3e1: ListElement3 = { timestamp: "2023-09-09T12:30:00.000Z", value3: 31 };

        const expected: Array<ListElement[]> = [];
        const input = [[l1e1], [l2e1], [l3e1]].map(toAsync<ListElement>);

        const matched = await fromAsync(matchOnTimestamp(input));

        expect(matched).toEqual(expected);
    });

    it("No match with timestamp newer than 12h", async () => {
        const l1e1: ListElement1 = { timestamp: "2023-09-09T12:30:00.000Z", value1: 11 };
        const l2e1: ListElement2 = { timestamp: "2023-09-10T01:00:00.000Z", value2: 21 };
        const l3e1: ListElement3 = { timestamp: "2023-09-09T12:30:00.000Z", value3: 31 };

        const expected: Array<ListElement[]> = [];
        const input = [[l1e1], [l2e1], [l3e1]].map(toAsync<ListElement>);

        const matched = await fromAsync(matchOnTimestamp(input));

        expect(matched).toEqual(expected);
    });

    it("Match with timestamps within 12h", async () => {
        const l1e1: ListElement1 = { timestamp: "2023-09-09T00:00:00.000Z", value1: 11 };
        const l2e1: ListElement2 = { timestamp: "2023-09-09T06:00:00.000Z", value2: 21 };
        const l3e1: ListElement3 = { timestamp: "2023-09-09T12:00:00.000Z", value3: 31 };

        const expected: Array<ListElement[]> = [[l1e1, l2e1, l3e1]];
        const input = [[l1e1], [l2e1], [l3e1]].map(toAsync<ListElement>);

        const matched = await fromAsync(matchOnTimestamp(input));

        expect(matched).toEqual(expected);
    });

    it("Match only closest (newer)", async () => {
        const l1e1: ListElement1 = { timestamp: "2023-09-09T00:00:00.000Z", value1: 11 };
        const l2e1: ListElement2 = { timestamp: "2023-09-08T20:00:00.000Z", value2: 21 };
        const l2e2: ListElement2 = { timestamp: "2023-09-09T02:00:00.000Z", value2: 22 };
        const l2e3: ListElement2 = { timestamp: "2023-09-09T03:00:00.000Z", value2: 23 };

        const expected: Array<ListElement[]> = [[l1e1, l2e2]];
        const input = [[l1e1], [l2e1, l2e2, l2e3]].map(toAsync<ListElement>);

        const matched = await fromAsync(matchOnTimestamp(input));

        expect(matched).toEqual(expected);
    });

    it("Match only closest (older)", async () => {
        const l1e1: ListElement1 = { timestamp: "2023-09-09T00:00:00.000Z", value1: 11 };
        const l2e1: ListElement2 = { timestamp: "2023-09-08T22:00:00.000Z", value2: 21 };
        const l2e2: ListElement2 = { timestamp: "2023-09-09T03:00:00.000Z", value2: 22 };
        const l2e3: ListElement2 = { timestamp: "2023-09-09T04:00:00.000Z", value2: 23 };

        const expected: Array<ListElement[]> = [[l1e1, l2e1]];
        const input = [[l1e1], [l2e1, l2e2, l2e3]].map(toAsync<ListElement>);

        const matched = await fromAsync(matchOnTimestamp(input));

        expect(matched).toEqual(expected);
    });

    it("Match overlap", async () => {
        const l1e1: ListElement1 = { timestamp: "2023-09-09T00:00:00.000Z", value1: 11 };
        const l1e2: ListElement1 = { timestamp: "2023-09-09T12:00:00.000Z", value1: 12 };
        const l1e3: ListElement1 = { timestamp: "2023-09-10T00:00:00.000Z", value1: 13 };
        const l2e1: ListElement2 = { timestamp: "2023-09-09T12:00:00.000Z", value2: 21 };

        const expected: Array<ListElement[]> = [
            [l1e1, l2e1],
            [l1e2, l2e1],
            [l1e3, l2e1],
        ];
        const input = [[l1e1, l1e2, l1e3], [l2e1]].map(toAsync<ListElement>);

        const matched = await fromAsync(matchOnTimestamp(input));

        expect(matched).toEqual(expected);
    });

    it("Match multiple", async () => {
        const l1e1: ListElement1 = { timestamp: "2023-09-09T00:00:00.000Z", value1: 11 };
        const l1e2: ListElement1 = { timestamp: "2023-09-10T00:00:00.000Z", value1: 12 };
        const l1e3: ListElement1 = { timestamp: "2023-09-11T00:00:00.000Z", value1: 13 };
        const l2e1: ListElement2 = { timestamp: "2023-09-09T06:00:00.000Z", value2: 21 };
        const l2e2: ListElement2 = { timestamp: "2023-09-09T12:00:00.000Z", value2: 22 };
        const l2e3: ListElement2 = { timestamp: "2023-09-09T18:00:00.000Z", value2: 23 };

        const expected: Array<ListElement[]> = [
            [l1e1, l2e1],
            [l1e2, l2e3],
        ];
        const input = [
            [l1e1, l1e2, l1e3],
            [l2e1, l2e2, l2e3],
        ].map(toAsync<ListElement>);

        const matched = await fromAsync(matchOnTimestamp(input));

        expect(matched).toEqual(expected);
    });

    it("Test different resolutions", async () => {
        // TODO use own range implementation
        // getDatesBetween
        const l1e1: ListElement1 = { timestamp: "2023-09-09T00:00:00.000Z", value1: 11 };
        const l1e2: ListElement1 = { timestamp: "2023-09-10T00:00:00.000Z", value1: 12 };
        const l1e3: ListElement1 = { timestamp: "2023-09-11T00:00:00.000Z", value1: 13 };
        const l2e1: ListElement2 = { timestamp: "2023-09-09T06:00:00.000Z", value2: 21 };
        const l2e2: ListElement2 = { timestamp: "2023-09-09T12:00:00.000Z", value2: 22 };
        const l2e3: ListElement2 = { timestamp: "2023-09-09T18:00:00.000Z", value2: 23 };

        const expected: Array<ListElement[]> = [
            [l1e1, l2e1],
            [l1e2, l2e3],
        ];
        const input = [
            [l1e1, l1e2, l1e3],
            [l2e1, l2e2, l2e3],
        ].map(toAsync<ListElement>);

        const matched = await fromAsync(matchOnTimestamp(input));

        expect(matched).toEqual(expected);
    });
});
