"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFirstElement = exports.StreamStats = exports.StreamMax = exports.StreamMin = exports.StreamMedian = void 0;
const lodash_1 = __importDefault(require("lodash"));
const array_1 = require("./array");
const math_1 = require("./math");
class StreamMedian {
    constructor(path, sampleSize) {
        this.path = path;
        this.sampler = new array_1.ReservoirSampler(sampleSize);
    }
    add(value) {
        this.sampler.insert(value);
    }
    get() {
        return (0, math_1.medianBy)(this.sampler.values, this.path);
    }
}
exports.StreamMedian = StreamMedian;
class StreamMin {
    constructor(path) {
        this.path = path;
        this.value = null;
    }
    add(value) {
        if (this.value == null || lodash_1.default.lt(lodash_1.default.get(value, this.path), lodash_1.default.get(this.value, this.path))) {
            this.value = value;
        }
    }
    get() {
        return this.value;
    }
}
exports.StreamMin = StreamMin;
class StreamMax {
    constructor(path) {
        this.path = path;
        this.value = null;
    }
    add(value) {
        if (this.value == null || lodash_1.default.gt(lodash_1.default.get(value, this.path), lodash_1.default.get(this.value, this.path))) {
            this.value = value;
        }
    }
    get() {
        return this.value;
    }
}
exports.StreamMax = StreamMax;
class StreamStats {
    constructor(path, sampleSize) {
        this.min = new StreamMin(path);
        this.median = new StreamMedian(path, sampleSize);
        this.max = new StreamMax(path);
    }
    add(value) {
        this.min.add(value);
        this.median.add(value);
        this.max.add(value);
    }
    get() {
        return {
            min: this.min.get(),
            median: this.median.get(),
            max: this.max.get(),
        };
    }
}
exports.StreamStats = StreamStats;
async function getFirstElement(stream) {
    const iterator = stream[Symbol.asyncIterator]();
    const firstElement = await iterator.next();
    return [firstElement.value, stream];
}
exports.getFirstElement = getFirstElement;
//# sourceMappingURL=stream.js.map