import type { Handler } from 'aws-lambda';
import type { DestructuredHandler, Logger } from '@/instance';
import type { PromiseType } from '@/types';

export type FilterFunction = (() => boolean)|boolean;

export type InitResolver = (() => Promise<void>)|Promise<void>;

export interface Resolver {
    promise: (() => Promise<void>)|Promise<void>;
    sync: boolean;
}

export type Hook = 'before'|'after'|'uncaughtException';

export interface HookReturns {
    before: BeforeMiddlewarePayload;
    after: AfterMiddlewarePayload;
    uncaughtException: UncaughtExceptionMiddlewarePayload;
}

export type Wrapper<H extends Handler = Handler> = (handler: DestructuredHandler<H>) => DestructuredHandler<H>;

export interface MiddlewarePayload<H extends Handler, S extends object = {}> {
    event: Parameters<H>['0'];
    context: Parameters<H>['1'];
    debug: boolean;
    logger: Logger;
    state: S;
}

export interface BeforeMiddlewarePayload<H extends Handler = Handler, S extends object = {}> extends MiddlewarePayload<H, S> {
    response?: PromiseType<Exclude<ReturnType<H>, void>>|Error;
}

export interface AfterMiddlewarePayload<H extends Handler = Handler, S extends object = {}> extends MiddlewarePayload<H, S> {
    response: PromiseType<Exclude<ReturnType<H>, void>>|Error;
}

export interface UncaughtExceptionMiddlewarePayload<H extends Handler = Handler, S extends object = {}> extends AfterMiddlewarePayload<H, S> {
    cause: UncaughtException;
}

export type MiddlewareHandler<H extends Handler, P extends MiddlewarePayload<H>> = (payload: P) => Promise<P>;

export type InitHandler<S extends object = {}> = (state: () => S) => Promise<Partial<S>|void>;

export interface Middleware<H extends Handler = Handler, S extends object = {}> {
    id: string;
    pure?: boolean;
    state?: S;
    wrap?: Wrapper<H>;
    logger?: (state: S) => Logger;
    filter?: FilterFunction;
    init?: InitHandler<S>;
    before?: MiddlewareHandler<H, BeforeMiddlewarePayload<H, S>>;
    after?: MiddlewareHandler<H, AfterMiddlewarePayload<H, S>>;
    uncaughtException?: MiddlewareHandler<H, UncaughtExceptionMiddlewarePayload<H, S>>;
}

export interface MiddlewareRegistry {
    all: Record<string, Middleware>;
    state: Record<string, any>;
    order: Record<Hook, (string|string[])[]>;
}

export interface UncaughtException {
    exception: Error;
}
