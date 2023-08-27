# API Design

## General Considerations

-   The API should follow a [RESTful](https://restfulapi.net/resource-naming/) design.
-   The API should follow a [HATEOAS](https://en.wikipedia.org/wiki/HATEOAS) design
    by implementing [JSON Pointer (RFC6901)](https://datatracker.ietf.org/doc/html/rfc6901)
    and [JSON Reference](https://datatracker.ietf.org/doc/html/draft-pbryan-zyp-json-ref-03).
-   Implement [JSON Schema](https://json-schema.org/)
-   Implement [OAS 3.1.0](https://swagger.io/specification/)
-   The resources provided via the API should be consistent with the terminology used in the adapters.
-   Resources should have no circular references

## Helpful resources

-   Use [json-refs](https://github.com/whitlockjc/json-refs/tree/master) to parse and resolve JSON refs.
-   Use [joi](https://github.com/hapijs/joi) to generate JSON-schema.
-   [NPM Joi](https://www.npmjs.com/package/joi)
-   Verify openapi.json via [Swagger Demo](https://petstore.swagger.io/#/) and [Swagger Editor](https://editor-next.swagger.io/).
