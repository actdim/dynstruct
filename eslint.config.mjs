import eslint from '@eslint/js'; // js
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tsEslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import path from 'node:path';
import { fileURLToPath } from 'url';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// cmd line: DEBUG=eslint:*
export default defineConfig(
    // eslint.configs.recommended,
    // tsEslint.configs.recommended,
    // we can't use some configs because they are in the old format
    // prettierPlugin.configs.recommended,
    // reactPlugin.configs.recommended,
    // reactHooksPlugin.configs.recommended,
    // reactRefreshPlugin.configs.recommended,
    // jsxA11yPlugin.configs.recommended,
export default defineConfig([
    {
        ignores: ['dist/**', 'node_modules/**', '.out/**'],
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.out/**',
            '**/build/**',
            '**/coverage/**',
            '**/docs/**',
            '**/.storybook/**',
            '**/jest.config.ts',
            '**/*.d.ts',
        ],
    },
    js.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        files: ['**/*.{js,mjs,cjs}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
    },
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            '@typescript-eslint': tsPlugin,
            prettier: prettierPlugin,
            '@stylistic': stylistic,
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            'react-refresh': reactRefreshPlugin,
            'jsx-a11y': jsxA11yPlugin,
        },
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: ['./tsconfig.json', './tsconfig.dev.json'],
                tsconfigRootDir: import.meta.dirname,
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.node,
                ...globals.browser,
                NodeJS: 'readonly',
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            ...eslint.configs.recommended.rules,
            ...tsEslint.configs.recommended.rules,
            ...prettierPlugin.configs.recommended.rules,
            ...reactPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,
            ...reactRefreshPlugin.configs.recommended.rules,
            ...jsxA11yPlugin.configs.recommended.rules,
            // 'prettier/prettier': 'error',
            'prettier/prettier': 'off',
            'no-unused-vars': 'off',
            'no-undef': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            ...tsPlugin.configs.recommended.rules,

            // Pragmatic TS & JS overrides
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/consistent-type-exports': 'warn',
            '@typescript-eslint/consistent-type-imports': [
                'warn',
                { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
            ],
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/triple-slash-reference': 'off',
            'no-redeclare': 'off',
            '@typescript-eslint/no-redeclare': 'off',
            'no-empty': 'off',
            'no-constant-condition': 'warn',
            'no-async-promise-executor': 'warn',
            'no-prototype-builtins': 'off',
            'no-useless-escape': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                },
            ],
            '@typescript-eslint/no-misused-promises': [
                'error',
            '@typescript-eslint/ban-ts-comment': [
                'warn',
                {
                    checksVoidReturn: false,
                    'ts-nocheck': 'allow-with-description',
                    minimumDescriptionLength: 3,
                },
            ],
            'no-undef': 'off',
            'prefer-const': 'warn',
            'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

            // React overrides
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/jsx-no-useless-fragment': 'off',
            'react/display-name': 'off',
            'react-hooks/rules-of-hooks': 'warn',
            'react-hooks/exhaustive-deps': 'warn',
            'react-refresh/only-export-components': [
                'warn',
                {
                    allowConstantExport: true,
                },
            ],

            // Code style & formatting
            indent: 'off',
            semi: ['warn', 'always'],
            '@stylistic/eol-last': ['warn', 'always'],
            '@stylistic/padding-line-between-statements': [
                'warn',
                { blankLine: 'always', prev: '*', next: 'return' },
            ],
            '@stylistic/function-paren-newline': 'off',
        },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                // ecmaVersion: 2017,
                sourceType: 'module',
                project: ['./tsconfig.dev.json'],
                tsconfigRootDir: __dirname,
                ecmaFeatures: { jsx: true },
            },
            globals: {
                NodeJS: 'readonly', // or writable
                // ...globals.browser,
                // ...globals.node,
            },
        },
    }
    // File-pattern specific overrides
    // {
    //     files: ['src/**/*', 'test/**/*'],
    //     rules: {
    //         semi: ['warn', 'always'],
    //     },
    // },
    // {
    //     files: ['test/**/*'],
    //     rules: {
    //         'no-console': 'off',
    //     },
    // }
);
    },
]);
