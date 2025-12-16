import eslint from '@eslint/js'; // js
import { defineConfig } from 'eslint/config';
import tsEslint from 'typescript-eslint';
import globals from 'globals';

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

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
    {
        files: ['**/*.ts', '**/*.tsx'],
        plugins: {
            '@typescript-eslint': tsPlugin,
            prettier: prettierPlugin,
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            'react-refresh': reactRefreshPlugin,
            'jsx-a11y': jsxA11yPlugin,
        },
        ignores: ['dist/**', 'node_modules/**'],
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
            'prettier/prettier': 'error',
            'no-unused-vars': 'off',
            'no-undef': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-misused-promises': [
                'error',
                {
                    checksVoidReturn: false,
                },
            ],
            'react-refresh/only-export-components': [
                'warn',
                {
                    allowConstantExport: true,
                },
            ],
        },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                // ecmaVersion: 2017,
                sourceType: 'module',
                project: './tsconfig.json',
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
