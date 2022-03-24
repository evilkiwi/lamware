import type { PromiseType } from 'utility-types';
import type { Handler } from 'aws-lambda';
import type { FilterFunction, Middleware } from '@/middleware';

export interface Options {

}

export interface DestructuredHandlerOptions<H extends Handler, S extends object = {}> {
    event: Parameters<H>[0];
    context: Parameters<H>[1];
    state: S;
    callback: Parameters<H>[2];
}

export type DestructuredHandler<H extends Handler = Handler, S extends object = {}> = (options: DestructuredHandlerOptions<H, S>) => PromiseType<Exclude<ReturnType<H>, void>>;

export interface Instance<H extends Handler, S extends object = {}> {
    use: <M extends Middleware<H, any>>(middleware: M, filter?: FilterFunction) => Instance<H, S & NonNullable<M['state']>>;
    execute: (handler: DestructuredHandler<H, S>) => {
        clear: () => void;
        handler: Handler;
    };
}
