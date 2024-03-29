import _ from "lodash";
import path from "path";
import oas from "swagger-jsdoc";
import { FILES, PATHS } from "../../constants";
import { writeJson } from "../../utils/files";
import { Template } from "../../utils/template";

interface Spec {
    openapi?: string | undefined;
    info?: oas.Information | undefined;
    servers?: readonly oas.Server[] | undefined;
    paths?: oas.Paths | undefined;
    components?: oas.Components | undefined;
    security?: readonly oas.SecurityRequirement[] | undefined;
    tags?: readonly oas.Tag[] | undefined;
    externalDocs?: oas.ExternalDocumentation | undefined;
    [key: string]: any;
}

interface RegistrationParams {
    path: string;
    summary?: string | undefined;
    description?: string | undefined;
    parameters?: oas.Parameter | undefined;
    type: string;
    schema: oas.Schema;
}

export abstract class JsonResources {
    spec: Spec;
    tag: oas.Tag | undefined;

    constructor(
        tag?: oas.Tag,
        spec?: oas.OAS3Definition | undefined,
        ...resources: JsonResources[]
    ) {
        this.tag = tag;
        this.spec = spec ? spec : {};
        if (tag) {
            this.extendSpec({ tags: this.tag ? [this.tag] : [] });
        }
        this.extend(...resources);
    }

    register({ path, summary, description, parameters, type, schema }: RegistrationParams) {
        // Only register if not already registered
        if (this.spec.paths?.[path]) return;

        this.extendSpec({
            paths: {
                [path]: {
                    get: {
                        tags: this.tag ? [this.tag.name] : [],
                        summary: summary,
                        description: description,
                        parameters: parameters
                            ? [parameters]
                            : new Template(path).keys().map((key) => ({
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

    extend(...resources: JsonResources[]) {
        this.extendSpec(...resources.map((r) => r.spec));
    }

    private extendSpec(...specs: Spec[]) {
        _.mergeWith(this.spec, ...specs, (objValue: any, srcValue: any) => {
            if (_.isArray(objValue)) {
                return objValue.concat(srcValue);
            }
            return;
        });
    }

    /**
     * Decorator for registering a resource.
     */
    static register<Fn extends (this: any, ...args: any[]) => any>(params: RegistrationParams) {
        return function (target: Fn, context: ClassMethodDecoratorContext<JsonResources>) {
            // Register the resource schema when the context is initialized.
            context.addInitializer(function () {
                this.register(params);
            });

            // Extend the resource methods with a function that writes the resource to a file.
            return async function (this: any, ...args: any[]): Promise<any> {
                const resource = await target.call(this, ...args);
                if (!resource) return;
                const filePath = path.join(PATHS.api, resource.$id, FILES.json.index);
                await writeJson(filePath, resource);
                return resource;
            };
        };
    }

    abstract index(ids: string[]): Promise<any>;
}
