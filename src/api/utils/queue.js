"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueQueue = exports.Queue = void 0;
class Queue {
    constructor() {
        this.queue = new Array();
    }
    add(...items) {
        this.queue = this.queue.concat(items);
    }
    *itemGenerator() {
        while (this.queue.length > 0) {
            yield this.queue.shift();
        }
    }
    get items() {
        return this.itemGenerator();
    }
}
exports.Queue = Queue;
class UniqueQueue extends Queue {
    constructor() {
        super(...arguments);
        this.history = new Set();
    }
    add(...items) {
        for (const item of items) {
            if (!this.history.has(item)) {
                super.add(item);
            }
            this.history.add(item);
        }
    }
}
exports.UniqueQueue = UniqueQueue;
//# sourceMappingURL=queue.js.map