const details: bcked.system.Details = {
    name: "Real World Assets (RWA)",
    native: null,
    explorer: null,
};

export default class Adapter implements bcked.system.Adapter {
    async getDetails(): Promise<bcked.system.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
