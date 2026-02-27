import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs['flat/recommended'],
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        }
    },
    {
        files: ['**/*.svelte'],
        languageOptions: {
            parserOptions: {
                parser: ts.parser
            }
        }
    },
    {
        ignores: ['build/', '.svelte-kit/', 'dist/']
    },
    {
        rules: {
            // Design System Enforcement
            // Ideally use a plugin like eslint-plugin-tailwindcss or customized restricted-syntax
            // to ban "bg-[#hex]" and force "bg-[var(--color-name)]"
            "no-restricted-syntax": [
                "warn",
                {
                    "selector": "Literal[value=/^#([0-9A-F]{3}){1,2}$/i]",
                    "message": "Do not use hex colors directly. Use Design System variables (e.g. var(--color-primary))."
                }
            ]
        }
    }
];
