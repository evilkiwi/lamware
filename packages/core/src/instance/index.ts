import type { PromiseType } from 'utility-types';
import type { Handler } from 'aws-lambda';
import { merge } from 'merge-anything';
import { register, runMiddleware, init, wrap, clear, compileState, loggerOverride } from '@/middleware';
import type { BeforeMiddlewarePayload, MiddlewarePayload } from '@/middleware';
import type { Instance, Options } from './types';

export const lamware = <H extends Handler = Handler>(options?: Options) => {
    options = options ?? {};

    const debug = options.debug ?? false;
    const logger = options.logger ?? console;

    const instance: Instance<H> = {
        use: (middleware, filter) => {
            if (filter !== undefined) {
                if (middleware.filter === undefined) {
                    middleware.filter = filter;
                } else {
                    const originalFilter = middleware.filter;
                    middleware.filter = () => filter() && originalFilter();
                }
            }

            register<H>(middleware);

            return instance;
        },
        execute: handler => {
            return {
                clear,
                handler: async (event, context, callback) => {
                    let response: PromiseType<Exclude<ReturnType<H>, void>>|Error;

                    try {
                        await init();
                    } catch (e) {
                        throw new Error(`failed to initialize: ${e}`);
                    }

                    // Find a logger from the Middleware.
                    const localLogger = loggerOverride() ?? logger;

                    // Create the various middleware payloads.
                    const basePayload: MiddlewarePayload<H> = {
                        debug,
                        logger: localLogger,
                        state: compileState(),
                    };

                    let payload: BeforeMiddlewarePayload<H> = {
                        ...basePayload,
                        event,
                        context,
                    };

                    try {
                        payload = await runMiddleware('before', payload);

                        if (payload.response === undefined) {
                            const wrapped = wrap(handler);

                            response = await wrapped({
                                event: payload.event,
                                context: payload.context,
                                logger: localLogger,
                                state: compileState(),
                                callback,
                            });
                        } else {
                            response = payload.response;
                        }
                    } catch (e) {
                        response = e as Error;
                    }

                    const mixed = await runMiddleware('after', {
                        ...basePayload,
                        response,
                    });

                    if (mixed.response instanceof Error) {
                        throw mixed.response;
                    }

                    response = merge<any, any>(response, mixed.response);

                    return response;
                },
            };
        },
    };

    return instance;
};

export * from './types';
