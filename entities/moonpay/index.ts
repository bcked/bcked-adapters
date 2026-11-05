const details: bcked.entity.Details = {
    name: "MoonPay",
    identifier: "moonpay",
    reference: "https://www.moonpay.com/",
    tags: [],
};

export default class Adapter implements bcked.entity.Adapter {
    async getDetails(): Promise<bcked.entity.Details> {
        return details;
    }

    async update(): Promise<void> {}
}
