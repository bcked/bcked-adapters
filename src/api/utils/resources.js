"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonResources = void 0;
const lodash_1 = __importDefault(require("lodash"));
const template_1 = require("../utils/template");
class JsonResources {
    constructor(tag, spec, ...resources) {
        this.tag = tag;
        this.spec = spec ? spec : {};
        if (tag) {
            this.extendSpec({ tags: this.tag ? [this.tag] : [] });
        }
        if (resources) {
            this.extend(...resources);
        }
    }
    register({ path, summary, description, parameters, // TODO needed?
    type, schema, loader, }) {
        this.extendSpec({
            paths: {
                [path]: {
                    get: {
                        tags: this.tag ? [this.tag.name] : [],
                        summary: summary,
                        description: description,
                        responses: {
                            "200": {
                                description: "Successful response",
                                content: {
                                    "application/json": {
                                        schema: {
                                            $ref: `#/components/schemas/${type}`,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            components: {
                schemas: {
                    [type]: schema,
                },
            },
            loaders: [{ template: new template_1.Template(path), loader }],
        });
    }
    extend(...resources) {
        this.extendSpec(...resources.map((r) => r.spec));
    }
    extendSpec(...specs) {
        lodash_1.default.mergeWith(this.spec, ...specs, (objValue, srcValue) => {
            if (lodash_1.default.isArray(objValue)) {
                return objValue.concat(srcValue);
            }
            return;
        });
    }
    async resolve(uri) {
        const { template, loader } = (this.spec.loaders ?? []).find(({ template }) => template.test(uri));
        const params = template.entries(uri);
        const resource = await loader(params);
        return resource;
    }
}
exports.JsonResources = JsonResources;
//# sourceMappingURL=resources.js.map