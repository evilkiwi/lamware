import { defineConfig } from 'vitest/config';
import { builtinModules } from 'module';
import { join, resolve } from 'path';
import pkg from './package.json';

export default defineConfig({
    root: __dirname,
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
        minify: process.env.MODE === 'development' ? false : 'terser',
        target: 'node14',
        terserOptions: {
            ecma: 2020,
            compress: {
                passes: 2,
            },
            safari10: false,
        },
        lib: {
            entry: join('src', 'index.ts'),
            fileName: 'index',
            name: 'Lamware',
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
