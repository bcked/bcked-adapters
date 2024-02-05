"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonResources = void 0;
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const paths_1 = require("../../paths");
const files_1 = require("../../utils/files");
const template_1 = require("../../utils/template");
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
    register({ path, summary, description, parameters, type, schema }) {
        // Only register if not already registered
        if (this.spec.paths && this.spec.paths[path])
            return;
        this.extendSpec({
            paths: {
                [path]: {
                    get: {
                        tags: this.tag ? [this.tag.name] : [],
                        summary: summary,
                        description: description,
                        parameters: parameters
                            ? [parameters]
                            : new template_1.Template(path).keys().map((key) => ({
                                in: "path",
                                name: key,
                                required: true,
                                schema: { type: "string" },
                            })),
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
    /**
     * Decorator for registering a resource.
     */
    static register(params) {
        return function (target, context) {
            // Register the resource schema when the context is initialized.
            context.addInitializer(function () {
                this.register(params);
            });
            // Extend the resource methods with a function that writes the resource to a file.
            return async function (...args) {
                const resource = await target.call(this, ...args);
                if (!resource)
                    return;
                const filePath = path_1.default.join(paths_1.PATHS.api, resource.$id, "index.json");
                await (0, files_1.writeJson)(filePath, resource);
                return resource;
            };
        };
    }
}
exports.JsonResources = JsonResources;
//# sourceMappingURL=resources.js.map