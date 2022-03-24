import { build } from 'esbuild';
import { join } from 'path';
import { Env } from './types';
import type { Options } from './types';

export const bundle = async (options: Options) => {
    try {
        const env = options.env ?? Env.Production;
        const isProduction = env === Env.Production;
        const entryPoints: string[] = [
            ...(Array.isArray(options.entry) ? options.entry : (
                [options.entry ?? join(options.cwd, 'src', 'index.ts')]
            )),
        ];

        await build({
            bundle: true,
            minify: isProduction,
            watch: !isProduction,
            sourcemap: isProduction ? 'linked' : false,
            target: `node${options.nodeVersion ?? 14}`,
            outdir: options.outDir ?? 'build',
            entryPoints,
            platform: 'node',
            external: [
                ...(options.external ?? []),
            ],
        });
    } catch (e) {
        console.error('failed to bundle:', e);
    }
};

export * from './types';
