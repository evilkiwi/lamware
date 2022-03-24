import { readdirSync, statSync } from 'fs-extra';
import { createHash } from 'crypto';
import { join } from 'path';
import type { Options } from './types';

export const hash = (options: Options) => {
    const calcHash = createHash('sha256');
    const rootPath = options.root ?? options.path;
    const info = readdirSync(options.path, {
        withFileTypes: true,
    });

    info.forEach(file => {
        const fullPath = join(options.path, file.name);
        const relativePath = fullPath.replace(rootPath, '');

        if (file.isFile() && (!options.files || options.files.indexOf(file.name) !== -1)) {
            const statInfo = statSync(fullPath);
            const fileHash = `${relativePath}:${statInfo.size}`;
            calcHash.update(fileHash);
        } else if (file.isDirectory()) {
            (options.folders ?? [relativePath.substr(1)]).forEach(name => {
                if (relativePath.startsWith(`/${name}`)) {
                    calcHash.update(hash({
                        path: fullPath,
                        folders: options.folders,
                        root: rootPath,
                    }));
                }
            });
        }
    });

    if (options.name) {
        calcHash.update(options.name);
    }

    return calcHash.digest('base64');
};
