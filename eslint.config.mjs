import { defineConfig } from 'eslint/config';
import { base } from '@actdim/dev-config/eslint';
import { react } from '@actdim/dev-config/eslint/react';

const reactBlocks = react({ a11y: true });
// Plugin objects registered by the react() preset (no direct plugin devDependencies needed here)
const {
    react: reactPlugin,
    'react-refresh': reactRefreshPlugin,
    'jsx-a11y': jsxA11yPlugin,
} = reactBlocks[0].plugins;

// cmd line: DEBUG=eslint:*
export default defineConfig([
    ...base({
        tsconfigRootDir: import.meta.dirname,
        noExplicitAny: 'off',
        severity: 'warn',
        indent: 'off',
        jsx: true,
        // The demo app (demo/) is a separate workspace package with its own lint setup.
        extraIgnores: ['demo/**', '**/.storybook/**', '**/jest.config.ts'],
    }),
    {
        // Recommended sets that the react() preset does not enable. react-hooks: only rules-of-hooks /
        // exhaustive-deps (from the preset). The v6 `recommended` set adds React Compiler rules (refs, immutability,
        // globals, purity) that contradict the component model (mutable reactive model, lazy refs read during render).
        files: ['**/*.{ts,tsx}'],
        plugins: {
            react: reactPlugin,
            'react-refresh': reactRefreshPlugin,
            'jsx-a11y': jsxA11yPlugin,
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactRefreshPlugin.configs.recommended.rules,
            ...jsxA11yPlugin.configs.recommended.rules,
        },
    },
    ...reactBlocks,
    {
        // Local differences from the shared base preset (kept to preserve the previous rule set)
        files: ['**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-require-imports': 'error',
            // ignoreReadBeforeAssign: the canonical `let c; let m;` hook-constructor pattern (closures in `def` read them
            // before `c = useComponent(...)` assigns them)
            'prefer-const': ['warn', { ignoreReadBeforeAssign: true }],
        },
    },
]);
