import type { Handler } from 'aws-lambda';
import { merge } from 'merge-anything';
import type { DestructuredHandler } from '@/instance';
import type { Middleware, MiddlewareRegistry } from './types';

let initResolvers: Promise<void>[] = [];
const registry: MiddlewareRegistry = {
    all: {},
    state: {},
    order: {
        before: [],
        after: [],
    },
};

export const init = async () => Promise.all(initResolvers);

export const wrap = (handler: DestructuredHandler) => {
    Object.values(registry.all).forEach(middleware => {
        if (middleware.wrap !== undefined) {
            handler = middleware.wrap(handler);
        }
    });

    return handler;
};

export const compileState = () => {
    let state: any = {};

    Object.values(registry.state).forEach(middlewareState => {
        state = merge(state, middlewareState);
    });

    return state;
};

export const runMiddleware = async (hook: 'before'|'after', payload: any) => {
    return registry.order[hook].reduce(async (promise, id) => {
        let localPayload = await promise;

        if (hook === 'before' && localPayload.response !== undefined) {
            return localPayload;
        }

        if (Array.isArray(id)) {
            const payloads: Promise<any>[] = [];
            const total = id.length;

            for (let i = 0; i < total; i++) {
                const middleware = registry.all[id[i]]?.[hook];

                if (middleware !== undefined && (!(registry.all[id[i]]?.filter) || (registry.all[id[i]].filter?.() ?? true))) {
                    payloads.push(new Promise(async (resolve) => {
                        const middlewareResponse = await middleware(localPayload);
                        registry.state[registry.all[id[i]].id] = middlewareResponse.state;
                        resolve(middlewareResponse);
                    }));
                }
            }

            (await Promise.all(payloads)).forEach(newPayload => {
                localPayload = merge(localPayload, newPayload);
            });

            return localPayload;
        }

        const middleware = registry.all[id];

        if (middleware && middleware[hook] && (!middleware.filter || middleware.filter())) {
            const middlewareResponse = await middleware[hook]?.(localPayload);
            registry.state[id] = middlewareResponse?.state ?? {};
            return middlewareResponse;
        }

        return localPayload;
    }, Promise.resolve(payload));
};

export const register = <H extends Handler>(middleware: Middleware<H>) => {
    if (registry.all[middleware.id] !== undefined) {
        throw new Error(`middleware with name "${middleware.id}" already exists`);
    }

    registry.all[middleware.id] = (middleware as unknown) as Middleware<Handler>;

    for (let i = 0; i < 2; i++) {
        const key = i === 0 ? 'before' : 'after';

        if (middleware[key] !== undefined) {
            if (middleware.pure) {
                const length = registry.order[key].length;
                const last = registry.order[key][length - 1];

                if (Array.isArray(last)) {
                    last.push(middleware.id);
                } else {
                    registry.order[key].push([middleware.id]);
                }
            } else {
                registry.order[key].push(middleware.id);
            }
        }
    }

    if (middleware.init !== undefined) {
        initResolvers.push(new Promise(async (resolve) => {
            const state = await middleware.init?.() ?? {};
            registry.state[middleware.id] = state;
            resolve();
        }));
    }
};

export const clear = () => {
    initResolvers = [];
    registry.all = {};
    registry.state = {};
    registry.order.before = [];
    registry.order.after = [];
};

export * from './types';
