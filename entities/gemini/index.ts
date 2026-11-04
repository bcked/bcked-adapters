const details: bcked.entity.Details = {
    name: "Gemini",
    identifier: "gemini",
    reference: "https://www.gemini.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
