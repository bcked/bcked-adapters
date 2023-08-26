"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Template = void 0;
const lodash_1 = __importDefault(require("lodash"));
const ID_KEY = "([^/]+?)";
const ID = new RegExp(`{${ID_KEY}}`, "g");
class Template {
    constructor(template) {
        this.template = template;
    }
    keys() {
        return ID.exec(this.template)?.slice(1) ?? [];
    }
    values(str) {
        const matcher = this.template.replaceAll(ID, ID_KEY);
        return new RegExp(`^${matcher}$`).exec(str)?.slice(1) ?? [];
    }
    entries(str) {
        const keys = this.keys();
        const values = this.values(str);
        return lodash_1.default.zipObject(keys, values);
    }
    test(str) {
        const matcher = this.template.replaceAll(ID, ID_KEY);
        return new RegExp(`^${matcher}$`).test(str);
    }
    format(mapping) {
        let template = this.template;
        for (const [key, value] of Object.entries(mapping)) {
            template = template.replace(new RegExp(`\\{${key}\\}`, "gi"), value);
        }
        return template;
    }
}
exports.Template = Template;
//# sourceMappingURL=template.js.map