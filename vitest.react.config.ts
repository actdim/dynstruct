import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import config from './packageConfig.ts';

export default defineConfig({
    test: {
        watch: false,
        reporters: 'verbose',
        name: 'react',
        globals: true,
        environment: 'happy-dom',
        setupFiles: [resolve('./vitest.react.setup.ts')],
        include: ['tests/react/**/*.{test,spec}.{ts,tsx}'],
        typecheck: {
            tsconfig: 'tsconfig.react.vitest.json',
        },
        root: resolve('.'),
    },
    resolve: {
        alias: config.resolveAliases(),
    },
    plugins: [react()],
    base: './',
});
