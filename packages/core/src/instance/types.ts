import type { PromiseType } from 'utility-types';
import type { Handler } from 'aws-lambda';
import type { FilterFunction, Middleware } from '@/middleware';

export type Logger = Pick<typeof console, 'debug'|'log'|'error'|'info'>;

export interface Options {
    debug?: boolean;
    logger?: Logger;
}

export type LamwareState<C extends Instance<any, any>> = C extends Instance<infer A, infer B> ? B : unknown;

export interface DestructuredHandlerOptions<H extends Handler, S extends object = {}> {
    event: Parameters<H>[0];
    context: Parameters<H>[1];
    state: S;
    logger: Logger;
    callback: Parameters<H>[2];
}

export type DestructuredHandler<H extends Handler = Handler, S extends object = {}, R = PromiseType<Exclude<ReturnType<H>, void>>> = (options: DestructuredHandlerOptions<H, S>) => R|Promise<R>;

export interface Instance<H extends Handler, S extends object = {}> {
    use: <M extends Middleware<H, any>>(middleware: M, filter?: FilterFunction) => Instance<H, S & NonNullable<M['state']>>;
    execute: (handler: DestructuredHandler<H, S>) => {
        clear: () => void;
        handler: H;
        instance: Instance<H, S>;
    };
}
