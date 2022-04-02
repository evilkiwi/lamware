import { join } from 'path';
import type { Env } from '../../../build/esbuild';
import { bundle } from '../../../build/esbuild';

(async () => {
    const env = (process.env.NODE_ENV ?? 'production') as Env;
    const cwd = join(__dirname, '..');

    await bundle({
        env,
        cwd,
        entry: join(cwd, 'src', 'index.ts'),
    });
})();
