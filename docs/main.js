// @ts-check
// Swagger UI 5.11.2 is self-hosted in ./vendor/swagger-ui so the page loads no third-party scripts.
// The bundle defines window.SwaggerUIBundle.

// @ts-ignore
const ui = window.SwaggerUIBundle({
    url: "https://api.bcked.com/openapi.json",
    tryItOutEnabled: true,
    // filter: true,
    displayRequestDuration: true,
    requestSnippetsEnabled: true,
    dom_id: "#swagger-ui",
});
