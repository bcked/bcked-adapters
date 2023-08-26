declare namespace api {
    type URI = string;

    type Resource = { $id: URI } & Record<string, string | number | object>;

    type ResourceFn<T extends any[] = any[]> = (...args: T) => Promise<Resource>;
}
