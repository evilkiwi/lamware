export enum Env {
    Production = 'production',
    Development = 'development',
}

export interface Options {
    env?: Env;
    cwd: string;
    entry?: string|string[];
    nodeVersion?: number;
    outDir?: string;
    external?: string[];
}
