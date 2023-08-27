export class Queue<T> {
    private queue: Array<T> = new Array<T>();

    add(...items: T[]): void {
        this.queue = this.queue.concat(items);
    }

    private *itemGenerator(): Generator<T> {
        while (this.queue.length > 0) {
            yield this.queue.shift()!;
        }
    }

    get items(): Generator<T> {
        return this.itemGenerator();
    }
}

export class UniqueQueue<T> extends Queue<T> {
    private history: Set<T> = new Set<T>();

    override add(...items: T[]): void {
        for (const item of items) {
            if (!this.history.has(item)) {
                super.add(item);
            }
            this.history.add(item);
        }
    }
}
