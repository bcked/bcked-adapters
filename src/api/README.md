# API Design

## General Considerations

- The API should follow a [RESTful](https://restfulapi.net/resource-naming/) design.
- The API should follow a [HATEOAS](https://en.wikipedia.org/wiki/HATEOAS) design
  by implementing [JSON Pointer (RFC6901)](https://datatracker.ietf.org/doc/html/rfc6901)
  and [JSON Reference](https://datatracker.ietf.org/doc/html/draft-pbryan-zyp-json-ref-03).
- Implement [JSON Schema](https://json-schema.org/)
- Implement [OAS 3.1.0](https://swagger.io/specification/)
- The resources provided via the API should be consistent with the terminology used in the adapters.
- Resources should have no circular references

## Helpful resources

- Use [json-refs](https://github.com/whitlockjc/json-refs/tree/master) to parse and resolve JSON refs.
- Use [joi](https://github.com/hapijs/joi) to generate JSON-schema.
- [NPM Joi](https://www.npmjs.com/package/joi)
- Verify openapi.json via [Swagger Editor](https://editor.swagger.io/?url=https://api.bcked.com/openapi.json&tryItOutEnabled=true&filter=true&displayRequestDuration=true&requestSnippetsEnabled=true).

## History

A history (e.g. `/assets/{id}/price`) links its years, a year its months, a month its days and a day
its hours. Each hour holds one data point.

Months that end more than 90 days before a build are kept in one file: the month resource lists its
data points inline in `data`, and its day and hour resources do not exist. Every link to a point in
such a month (`low`, `median`, `high`, and links inside data points) is the month resource plus the
point's hour, e.g. `{ "$ref": "/assets/{id}/price/2024/03", "hour": "2024-03-05T00" }`. The latest
point of a history always keeps its own hour resource. This keeps the number of files small enough
for GitHub Pages (see `src/api/utils/consolidate.ts`).
