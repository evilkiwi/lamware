import { build } from 'esbuild';

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ['./src/index.ts'],
  packages: 'external',
  logLevel: 'debug',
  sourcemap: false,
  platform: 'node',
  target: 'node18',
  outdir: 'build',
  format: 'esm',
  bundle: true,
  minify: true,
};

await build({
  ...options,
  outExtension: { '.js': '.mjs' },
  format: 'esm',
});

await build({
  ...options,
  format: 'cjs',
});
