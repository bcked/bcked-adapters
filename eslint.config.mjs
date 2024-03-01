/* eslint-disable */
// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "**/node_modules/**",
            "**/coverage/**",
            "**/docs/**",
            "**/api/**",
            "**/dist/**",
            "**/package/**",
            "**/*.DS_Store",
            "**/.env",
            "**/.env.*",
            "**/!.env.example",
            "**/package-lock.json",
            "**/eslint.config.mjs",
            "**/jest.config.js",
        ],
    },
    // extends ...
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    // base config
    {
        languageOptions: {
            parserOptions: {
                // ecmaVersion: 2021,
                sourceType: "module",
                project: ["tsconfig.json"],
            },
        },
        rules: {
            "@typescript-eslint/no-non-null-assertion": "off",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": "error",

            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/no-redundant-type-constituents": "off",
            "@typescript-eslint/no-misused-promises": "off",
            "@typescript-eslint/no-floating-promises": "off",

            // Enable working with any
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
        },
    }
);
