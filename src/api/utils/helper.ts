export function templateToRegEx(template: string): RegExp {
    const matcher = template.replaceAll(/\${.*}/g, "([^/]+)");
    return new RegExp(`^${matcher}$`);
}
