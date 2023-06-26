export function secInMs(seconds: number): number {
    return seconds * 1000;
}

export function minInMs(minutes: number): number {
    return secInMs(minutes * 60);
}

export function hoursInMs(hours: number): number {
    return minInMs(hours * 60);
}
