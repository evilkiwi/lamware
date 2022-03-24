import type { PromiseType } from 'utility-types';
import type { Handler } from 'aws-lambda';
import { merge } from 'merge-anything';
import { register, runMiddleware, init, wrap, clear, compileState } from '@/middleware';
import type { BeforeMiddlewarePayload } from '@/middleware';
import type { Instance, Options } from './types';

export const lamware = <H extends Handler = Handler>(options?: Options) => {
    options = options ?? {};

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
                    let payload: BeforeMiddlewarePayload<H> = { event, context, state: {} };

                    try {
                        await init();

                        payload = await runMiddleware('before', payload);

                        if (payload.response === undefined) {
                            const wrapped = wrap(handler);

                            response = await wrapped({
                                event: payload.event,
                                context: payload.context,
                                state: compileState(),
                                callback,
                            });
                        } else {
                            response = payload.response;
                        }
                    } catch (e) {
                        response = e as Error;
                    }

                    const mixed = await runMiddleware('after', { response });

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
