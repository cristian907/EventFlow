import { fileURLToPath } from 'url';
import path from 'path';

import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importX from 'eslint-plugin-import-x';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sharedTsRules = {
    ...tseslint.configs.recommended.rules,
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'import-x/order': [
        'error',
        {
            groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
        },
    ],
};

const nodeOnlyRules = {
    '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
            allowExpressions: false,
            allowTypedFunctionExpressions: true,
            allowHigherOrderFunctions: true,
        },
    ],
};

export default [
    {
        ignores: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    },

    // api
    {
        files: ['packages/api/**/*.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['*.config.ts', '*.config.js'],
                },
                tsconfigRootDir: __dirname,
            },
            globals: { ...globals.node },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'import-x': importX,
        },
        rules: { ...sharedTsRules, ...nodeOnlyRules },
    },

    // shared
    {
        files: ['packages/shared/**/*.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                project: 'packages/shared/tsconfig.json',
                tsconfigRootDir: __dirname,
            },
            globals: { ...globals.node },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'import-x': importX,
        },
        rules: { ...sharedTsRules, ...nodeOnlyRules },
    },

    // web
    {
        files: ['packages/web/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                project: 'packages/web/tsconfig.json',
                tsconfigRootDir: __dirname,
                ecmaFeatures: { jsx: true },
            },
            globals: { ...globals.browser },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            react,
            'react-hooks': reactHooks,
            'import-x': importX,
        },
        settings: {
            react: { version: 'detect' },
        },
        rules: {
            ...sharedTsRules,
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
        },
    },

    prettier,
];
