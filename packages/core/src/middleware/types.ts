import type { PromiseType } from 'utility-types';
import type { Handler } from 'aws-lambda';

export interface MiddlewarePayload<H extends Handler> {

}

export interface BeforeMiddlewarePayload<H extends Handler = Handler> extends MiddlewarePayload<H> {
    event: Parameters<H>['0'];
    context: Parameters<H>['1'];
    response?: PromiseType<Exclude<ReturnType<H>, void>>|Error;
}

export interface AfterMiddlewarePayload<H extends Handler = Handler> extends MiddlewarePayload<H> {
    response: PromiseType<Exclude<ReturnType<H>, void>>|Error;
}

export type MiddlewareHandler<H extends Handler, P extends MiddlewarePayload<H>> = (payload: P) => Promise<P>;

export interface Middleware<H extends Handler = Handler> {
    id: string;
    pure?: boolean;
    init?: () => Promise<void>;
    wrap?: (handler: H) => H;
    before?: MiddlewareHandler<H, BeforeMiddlewarePayload<H>>;
    after?: MiddlewareHandler<H, AfterMiddlewarePayload<H>>;
}

export interface MiddlewareRegistry {
    all: Record<string, Middleware>;
    order: {
        before: (string|string[])[];
        after: (string|string[])[];
    };
}
