import { defineConfig } from 'vitest/config';
import { builtinModules } from 'module';
import { join, resolve } from 'path';
import dts from 'vite-plugin-dts';
import pkg from './package.json';

export default defineConfig({
    root: __dirname,
    plugins: [
        dts({
            outputDir: join(__dirname, 'build'),
            tsConfigFilePath: join(__dirname, 'tsconfig.json'),
            staticImport: true,
            skipDiagnostics: false,
            logDiagnostics: true,
        }),
    ],
    test: {
        coverage: {
            reporter: ['text', 'html'],
        },
    },
    resolve: {
        alias: [
            { find: /^@\/(.*)/, replacement: `${resolve(__dirname, 'src')}/$1` },
        ],
    },
    json: {
        namedExports: false,
        stringify: true,
    },
    build: {
        sourcemap: process.env.MODE === 'development' ? true : false,
        outDir: 'build',
        assetsDir: '.',
        minify: process.env.MODE === 'development' ? false : 'esbuild',
        target: 'node14',
        lib: {
            entry: join('src', 'index.ts'),
            fileName: 'index',
            name: 'LamwareDoNotWait',
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            external: [
                ...builtinModules,
                ...Object.keys(pkg.dependencies ?? {}),
            ],
        },
        emptyOutDir: true,
    },
});
