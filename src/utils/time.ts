import dateFormat from "dateformat";
import { Template } from "../api/utils/template";

export function secInMs(seconds: number): number {
    return seconds * 1000;
}

export function minInMs(minutes: number): number {
    return secInMs(minutes * 60);
}

export function hoursInMs(hours: number): number {
    return minInMs(hours * 60);
}

export function daysInMs(days: number): number {
    return hoursInMs(days * 24);
}

export function duration(first: primitive.DateLike, second: primitive.DateLike): number {
    return new Date(first).getTime() - new Date(second).getTime();
}

export function isNewer(
    first: primitive.DateLike,
    second: primitive.DateLike,
    threshold: number
): boolean {
    return duration(second, first) > threshold;
}

export function isClose(
    first: primitive.DateLike,
    second: primitive.DateLike,
    threshold: number
): boolean {
    return Math.abs(duration(second, first)) <= threshold;
}

export function isCloser(
    reference: primitive.DateLike,
    first: primitive.DateLike,
    second: primitive.DateLike
): boolean {
    return Math.abs(duration(reference, first)) < Math.abs(duration(reference, second));
}

export function* getDatesBetween(
    start: primitive.DateLike,
    end: primitive.DateLike,
    stepSizeInMs: number
): Generator<Date, void> {
    const startTimestamp = new Date(start).getTime();
    const endTimestamp = new Date(end).getTime();

    for (
        let timestamp = startTimestamp + stepSizeInMs;
        timestamp <= endTimestamp;
        timestamp += stepSizeInMs
    ) {
        yield new Date(timestamp);
    }
}

export function getDateParts(timestamp: primitive.DateLike): primitive.DateParts {
    return {
        year: dateFormat(timestamp, "UTC:yyyy"),
        month: dateFormat(timestamp, "UTC:mm"),
        day: dateFormat(timestamp, "UTC:dd"),
        hour: dateFormat(timestamp, "UTC:HH"),
    };
}

export function setDateParts(template: string, timestamp: primitive.DateLike): string {
    const parts = getDateParts(timestamp);
    return new Template(template).format(parts as Record<string, string>);
}

export function partsToDate(parts: primitive.DateParts): Date {
    const isoString = new Template("{year}-{month}-{day}T{hour}:00:00.000Z").format(
        parts as Record<string, string>
    );
    return new Date(isoString);
}
