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
    loaders?: { template: Template; loader: api.ResourceFn }[];
    [key: string]: any;
}

export class JsonResources {
    spec: Spec;

    constructor(spec?: oas.OAS3Definition | undefined, ...resources: JsonResources[]) {
        this.spec = spec ? spec : {};
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
        loader,
    }: {
        path: string;
        summary?: string | undefined;
        description?: string | undefined;
        parameters?: oas.Parameter | undefined;
        type: string;
        schema: oas.Schema;
        loader: api.ResourceFn;
    }) {
        this.extendSpec({
            paths: {
                [path]: {
                    get: {
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
            loaders: [{ template: new Template(path), loader }],
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

    async resolve(uri: string) {
        const { template, loader } = (this.spec.loaders ?? []).find(({ template }) =>
            template.test(uri)
        )!;

        const params = template.entries(uri);

        const resource = await loader(params);

        return resource;
    }
}
