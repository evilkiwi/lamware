import type { Handler } from 'aws-lambda';
import { merge } from 'merge-anything';
import type { DestructuredHandler, LamwareState, Instance } from '@/instance';
import type { Hook, HookReturns, Middleware, MiddlewareRegistry, InitResolver, Resolver } from './types';

let initResolvers: Resolver[] = [];
let initPure = true;

const registry: MiddlewareRegistry = {
    all: {},
    state: {},
    order: {
        before: [],
        after: [],
    },
};

export const init = async (next?: number) => {
    const toResolve: InitResolver[] = [];
    const total = initResolvers.length;
    const originalNext = next;

    if (initPure && next === undefined) {
        // If there was no `.useSync()`, just resolve everything.
        toResolve.push(...initResolvers.map(resolver => resolver.promise));
    } else {
        // Otherwise, we want to take order and sync in to account.
        for (let i = next ?? 0; i < total; i++) {
            const resolver = initResolvers[i];
            let shouldAdd = true;

            if (resolver.sync) {
                // If it's marked as `sync` but we already have some resolvers, exit the loop.
                if (toResolve.length > 0) {
                    shouldAdd = false;
                    next = i;
                } else {
                    next = i + 1;
                }

                i = total;
            }

            if (shouldAdd) {
                toResolve.push(resolver.promise);
            }
        }
    }

    // Of all the found initialization resolvers, well, resolve them!
    await Promise.all(toResolve.map(resolver => {
        return typeof resolver === 'function' ? resolver() : resolver;
    }));

    // Exit out of calling again if we've done everything.
    if (next !== undefined && (next >= total || next === originalNext)) {
        next = undefined;
    }

    // If we need to resolve more, queue it.
    if (next !== undefined) {
        await init(next);
    } else {
        // Let Garbage Collection kill all these.
        initResolvers = [];
    }
};

export const loggerOverride = () => {
    // Find a logger from the available middleware - first only.
    const middleware = Object.values(registry.all).find(middleware => {
        return middleware.logger !== undefined;
    });

    return middleware?.logger?.(registry.state[middleware?.id ?? ''] ?? {});
};

export const wrap = (handler: DestructuredHandler) => {
    return Object.values(registry.all).reduce((h, middleware) => {
        if (middleware.wrap) {
            return middleware.wrap(h);
        }

        return h;
    }, handler);
};

export const compileState = <I extends Instance<any, any>, S = LamwareState<I>>(): S => {
    let state: any = {};

    Object.values(registry.state).forEach(middlewareState => {
        state = merge(state, middlewareState);
    });

    return state;
};

export const shouldRun = (middleware: Middleware) => {
    return middleware.filter === undefined || (
        (typeof middleware.filter === 'function' && middleware.filter()) ||
        (typeof middleware.filter === 'boolean' && middleware.filter === true)
    );
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

            if (!middleware || !middlewareHook || !shouldRun(middleware)) {
                if (middleware.filter !== undefined) {
                    logDebug(`middleware \`${runId}\` was skipped by \`filter\``);
                }

                return runPayload;
            }

            logDebug(`running hook for \`${runId}\``);

            // @ts-ignore TODO: Figure out typing this properly.
            const response = await middlewareHook(runPayload);
            registry.state[runId] = merge(registry.state[runId] ?? {}, response?.state ?? {});

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

        return merge(localPayload, run(id, localPayload));
    }, Promise.resolve(payload));
};

export const register = <H extends Handler>(middleware: Middleware<H>, sync = false) => {
    if (registry.all[middleware.id] !== undefined) {
        throw new Error(`middleware with name "${middleware.id}" already exists`);
    } else if (!shouldRun(middleware)) {
        return;
    }

    registry.all[middleware.id] = (middleware as unknown) as Middleware<Handler>;

    for (let i = 0; i < 2; i++) {
        const key = i === 0 ? 'before' : 'after';

        if (middleware[key] !== undefined) {
            if (middleware.pure === false) {
                registry.order[key].push(middleware.id);
            } else {
                const length = registry.order[key].length;
                const last = registry.order[key][length - 1];

                if (Array.isArray(last)) {
                    last.push(middleware.id);
                } else {
                    registry.order[key].push([middleware.id]);
                }
            }
        }
    }

    if (middleware.init !== undefined) {
        if (sync && initPure) {
            initPure = false;
        }

        const promise = () => new Promise<void>(async (resolve, reject) => {
            try {
                const state = middleware.init !== undefined ? await middleware.init() : {};
                registry.state[middleware.id] = state;
                resolve();
            } catch (e) {
                reject(e);
            }
        });

        initResolvers.push({
            promise: !sync && initPure ? promise() : promise,
            sync,
        });
    }
};

export const clear = () => {
    initResolvers = [];
    initPure = true;
    registry.all = {};
    registry.state = {};
    registry.order.before = [];
    registry.order.after = [];
};

export * from './types';
