import { defineConfig } from "vite";
import config from "./packageConfig";
import dts from "vite-plugin-dts";
// import eslint from 'vite-plugin-eslint';
import tsConfigPaths from "vite-tsconfig-paths";
import * as packageJson from "./package.json";

const packageName = packageJson.name.split("/").reverse()[0];

export default defineConfig({
    resolve: {
        alias: config.resolveAliases()
    },
    build: {
        outDir: "dist",
        lib: {
            entry: "./src/index.ts",
            // name: packageName,
            formats: ["es"],
            fileName: (format) => `${packageName}.${format}.js`
        },
        rollupOptions: {
            input: config.srcFiles(),
            external: config.externals,
            output: {
                exports: "named",
                preserveModules: true, // incompatible with inlineDynamicImports: true
                preserveModulesRoot: "src",
                format: "esm",
                entryFileNames: "[name].es.js", // mjs
                sourcemapExcludeSources: false
            }
        },
        sourcemap: true,
        minify: false,
        emptyOutDir: true
    },
    esbuild: {
        // sourcemap: true,
        // target: "esnext",
        keepNames: true // important if minify: "esbuild"
    },
    server: {
        port: 5173,
        open: "/tests/browser/index.html",
        fs: {
            strict: false
        }
    },
    plugins: [
        // eslint({
        //     cache: false,
        //     failOnError: true,
        // }),
        tsConfigPaths(),
        dts({
            tsconfigPath: "./tsconfig.build.json",
            outDir: "dist",
            entryRoot: "src",
            include: ["src/**/*.ts", "src/**/*.tsx"],
            exclude: ["src/_stories/**/*"],
            rollupTypes: false,
            insertTypesEntry: false
        }),

        {
            name: "postBuild",
            closeBundle() {
                console.log("Use vite dedupe:", config.packages.join(", "));
            }
        }
    ]
});