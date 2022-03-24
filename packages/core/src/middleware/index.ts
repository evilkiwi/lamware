import type { Handler } from 'aws-lambda';
import { merge } from 'merge-anything';
import type { DestructuredHandler } from '@/instance';
import type { AfterMiddlewarePayload, BeforeMiddlewarePayload, Hook, HookReturns, Middleware, MiddlewareRegistry } from './types';

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

export const loggerOverride = () => {
    // Find a logger from the available middleware - first only.
    const middleware = Object.values(registry.all).find(middleware => {
        return middleware.logger !== undefined;
    });

    return middleware?.logger?.(registry.state[middleware?.id ?? ''] ?? {});
};

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

export const runMiddleware = async <H extends Hook>(hook: H, payload: HookReturns[H]): Promise<HookReturns[H]> => {
    const logDebug = (...args: unknown[]) => {
        if (payload.debug) {
            payload.logger.debug(...args);
        }
    };

    // @ts-ignore TODO: Figure out typing this properly.
    return registry.order[hook].reduce<Promise<HookReturns[H]>>(async (promise, id) => {
        let localPayload = await promise;

        logDebug(`running \`${hook}\` hooks`);

        if (hook === 'before' && localPayload.response !== undefined) {
            logDebug('previous middleware returned a response - exiting early');
            return localPayload;
        }

        const run = async (runId: string, runPayload: HookReturns[H]) => {
            const middleware = registry.all[runId];
            const middlewareHook = middleware?.[hook];

            if (
                !middleware || !middlewareHook ||
                (middleware.filter !== undefined && !middleware.filter())
            ) {
                if (middleware.filter !== undefined) {
                    logDebug(`middleware \`${runId}\` was skipped by \`filter\``);
                }

                return runPayload;
            }

            logDebug(`running hook for \`${runId}\``);

            // @ts-ignore TODO: Figure out typing this properly.
            const response = await middlewareHook(runPayload);
            registry.state[runId] = response?.state ?? {};

            return response;
        };

        if (Array.isArray(id)) {
            const payloads: ReturnType<typeof run>[] = [];
            const total = id.length;

            for (let i = 0; i < total; i++) {
                payloads.push(run(id[i], localPayload));
            }

            (await Promise.all(payloads)).forEach(newPayload => {
                localPayload = merge(localPayload, newPayload) as HookReturns[H];
            });

            return localPayload;
        }

        return run(id, localPayload);
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
