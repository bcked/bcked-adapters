const details: bcked.entity.Details = {
    name: "Paxos",
    identifier: "paxos",
    reference: "https://paxos.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
