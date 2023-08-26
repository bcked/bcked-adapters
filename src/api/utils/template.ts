import _ from "lodash";

const ID_KEY = "([^/]+?)";
const ID = new RegExp(`{${ID_KEY}}`, "g");

export class Template {
    template: string;

    constructor(template: string) {
        this.template = template;
    }

    keys(): string[] {
        return ID.exec(this.template)?.slice(1) ?? [];
    }

    values(str: string): string[] {
        const matcher = this.template.replaceAll(ID, ID_KEY);
        return new RegExp(`^${matcher}$`).exec(str)?.slice(1) ?? [];
    }

    entries(str: string): Record<string, string> {
        const keys = this.keys();
        const values = this.values(str);
        return _.zipObject(keys, values);
    }

    test(str: string): boolean {
        const matcher = this.template.replaceAll(ID, ID_KEY);
        return new RegExp(`^${matcher}$`).test(str);
    }

    format(mapping: { [key: string]: string }): string {
        let template = this.template;
        for (const [key, value] of Object.entries(mapping)) {
            template = template.replace(new RegExp(`\\{${key}\\}`, "gi"), value);
        }
        return template;
    }
}
