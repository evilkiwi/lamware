import { copySync, copyFileSync, readJsonSync, removeSync, writeJsonSync, ensureDirSync } from 'fs-extra';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import type { BuildOptions } from 'esbuild';
import { AssetHashType } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { buildSync } from 'esbuild';
import spawn from 'cross-spawn';
import { join } from 'path';
import type { FunctionProps } from './types';

export class LambdaFunction extends Function {
    constructor(scope: Construct, id: string, props: FunctionProps) {
        const handler = props.handler.replace('.handler', '.ts');
        let handlerLocal = handler.replace('.ts', '.handler');
        const handlerSplit = handlerLocal.split('/');
        handlerLocal = handlerSplit[handlerSplit.length - 1];
        const trueRoot = join(props.root, '..');

        super(scope, id, {
            ...props,
            handler: handlerLocal,
            environment: {
                ...(props.environment ?? {}),
                AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            },
            code: Code.fromAsset(props.projectRoot, {
                assetHash: props.hash,
                assetHashType: AssetHashType.CUSTOM,
                bundling: {
                    image: Runtime.NODEJS_14_X.bundlingImage,
                    local: {
                        tryBundle(outputDir) {
                            const buildOptions: BuildOptions = {
                                bundle: true,
                                minify: true,
                                target: `node${props.nodeVersion ?? 14}`,
                                external: props.external ?? [],
                                entryPoints: [join(props.projectRoot, handler)],
                                outdir: join(props.projectRoot, 'build'),
                                platform: 'node',
                                sourcemap: 'external',
                            };

                            removeSync(join(props.projectRoot, 'build'));

                            buildSync(buildOptions);

                            copySync(join(props.projectRoot, 'build'), outputDir, {
                                overwrite: true,
                            });

                            const originalPkg = readJsonSync(join(props.projectRoot, 'package.json'));
                            const deps = Object.keys(originalPkg.dependencies);

                            if (originalPkg.dependencies !== undefined && deps.length > 0) {
                                const pkg: any = {
                                    private: true,
                                    name: 'externals',
                                    version: '1.0.0',
                                    dependencies: {
                                        // package.json dependencies
                                        ...deps.filter(dep => {
                                            return (props.external ?? []).indexOf(dep) !== -1;
                                        }).reduce<Record<string, string>>((obj, dep) => {
                                            obj[dep] = originalPkg.dependencies[dep];

                                            return obj;
                                        }, {}),
                                    },
                                };

                                copyFileSync(join(trueRoot, '.yarnrc.yml'), join(outputDir, '.yarnrc.yml'));
                                ensureDirSync(join(trueRoot, '.yarn'));
                                copySync(join(trueRoot, '.yarn', 'plugins'), join(outputDir, '.yarn', 'plugins'));
                                copySync(join(trueRoot, '.yarn', 'releases'), join(outputDir, '.yarn', 'releases'));
                                writeJsonSync(join(outputDir, 'package.json'), pkg);

                                spawn.sync('yarn', ['install'], {
                                    cwd: outputDir,
                                    env: {
                                        ...process.env,
                                        YARN_ENABLE_IMMUTABLE_INSTALLS: 'false',
                                    },
                                    maxBuffer: 100 * 1024 * 1024 * 5,
                                });

                                removeSync(join(outputDir, '.yarn'));
                                removeSync(join(outputDir, 'node_modules', '.bin'));
                                removeSync(join(outputDir, 'node_modules', '.yarn-state.yml'));
                                removeSync(join(outputDir, 'package.json'));
                                removeSync(join(outputDir, '.yarnrc.yml'));
                                removeSync(join(outputDir, 'yarn.lock'));
                            }

                            return true;
                        },
                    },
                },
            }),
        });
    }
}

export * from './types';
