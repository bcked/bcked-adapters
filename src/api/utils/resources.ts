import _ from "lodash";
import oas from "swagger-jsdoc";
import { Template } from "../utils/template";

interface Spec {
    openapi?: string | undefined;
    info?: oas.Information | undefined;
    servers?: ReadonlyArray<oas.Server> | undefined;
    paths?: oas.Paths | undefined;
    components?: oas.Components | undefined;
    security?: ReadonlyArray<oas.SecurityRequirement> | undefined;
    tags?: ReadonlyArray<oas.Tag> | undefined;
    externalDocs?: oas.ExternalDocumentation | undefined;
    loaders?: {
        template: Template;
        loader: api.ResourceFn;
        populateCache: api.ResourceCacheFn | undefined;
    }[];
    [key: string]: any;
}

export class JsonResources {
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
        if (resources) {
            this.extend(...resources);
        }
    }

    register({
        path,
        summary,
        description,
        parameters, // TODO needed?
        type,
        schema,
        populateCache,
        loader,
    }: {
        path: string;
        summary?: string | undefined;
        description?: string | undefined;
        parameters?: oas.Parameter | undefined;
        type: string;
        schema: oas.Schema;
        populateCache?: api.ResourceCacheFn;
        loader: api.ResourceFn;
    }) {
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
            loaders: [{ template: new Template(path), loader, populateCache }],
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

    matchLoader(uri: string) {
        return (this.spec.loaders ?? []).find(({ template }) => template.test(uri))!;
    }

    async resolve(uri: string) {
        const { template, loader, populateCache } = this.matchLoader(uri);

        const params: Record<string, any> = template.entries(uri);

        if (populateCache) {
            params.populateCache = populateCache(params);
            params.populateCache.next(); // Start the generator
        }

        const resource = await loader(params);

        return resource;
    }
}
