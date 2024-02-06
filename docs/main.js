// @ts-check
import swagger from "swagger-ui-dist";

const ui = swagger.SwaggerUIBundle({
    url: "https://api.bcked.com/openapi.json",
    tryItOutEnabled: true,
    // filter: true,
    displayRequestDuration: true,
    requestSnippetsEnabled: true,
    dom_id: "#swagger-ui",
});
