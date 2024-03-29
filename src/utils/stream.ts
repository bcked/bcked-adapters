import _, { type PropertyPath } from "lodash";
import { ReservoirSampler } from "./array";
import { medianBy } from "./math";

export class StreamMedian<TObject extends object, TKey extends keyof TObject | PropertyPath> {
    private sampler: ReservoirSampler<TObject>;

    constructor(private path: TKey | PropertyPath, sampleSize: number) {
        this.sampler = new ReservoirSampler(sampleSize);
    }

    public add(value: TObject) {
        this.sampler.insert(value);
    }

    public get(): TObject | null {
        return medianBy(this.sampler.values, this.path);
    }
}

export class StreamMin<TObject extends object, TKey extends keyof TObject | PropertyPath> {
    private value: TObject | null;

    constructor(private path: TKey | PropertyPath) {
        this.value = null;
    }

    public add(value: TObject) {
        if (this.value == null || _.lt(_.get(value, this.path), _.get(this.value, this.path))) {
            this.value = value;
        }
    }

    public get(): TObject | null {
        return this.value;
    }
}

export class StreamMax<TObject extends object, TKey extends keyof TObject | PropertyPath> {
    private value: TObject | null;

    constructor(private path: TKey | PropertyPath) {
        this.value = null;
    }

    public add(value: TObject) {
        if (this.value == null || _.gt(_.get(value, this.path), _.get(this.value, this.path))) {
            this.value = value;
        }
    }

    public get(): TObject | null {
        return this.value;
    }
}

export interface Stats<TObject extends object> {
    min: TObject | null;
    median: TObject | null;
    max: TObject | null;
}

export class StreamStats<TObject extends object, TKey extends keyof TObject | PropertyPath> {
    private min: StreamMin<TObject, TKey>;
    private median: StreamMedian<TObject, TKey>;
    private max: StreamMax<TObject, TKey>;

    constructor(path: TKey | PropertyPath, sampleSize: number) {
        this.min = new StreamMin(path);
        this.median = new StreamMedian(path, sampleSize);
        this.max = new StreamMax(path);
    }

    public add(value: TObject) {
        this.min.add(value);
        this.median.add(value);
        this.max.add(value);
    }

    public get(): Stats<TObject> {
        return {
            min: this.min.get(),
            median: this.median.get(),
            max: this.max.get(),
        };
    }
}

export async function getFirstElement<T>(
    stream: AsyncIterable<T>
): Promise<[T | undefined, AsyncIterable<T>]> {
    const iterator = stream[Symbol.asyncIterator]();
    const firstElement = await iterator.next();
    return [firstElement.value, stream];
}
