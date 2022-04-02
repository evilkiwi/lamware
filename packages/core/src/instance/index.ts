import type { PromiseType } from 'utility-types';
import type { Handler } from 'aws-lambda';
import { merge } from 'merge-anything';
import type { BeforeMiddlewarePayload, MiddlewarePayload } from '@/middleware';
import { middleware } from '@/middleware';
import type { Instance, Options } from './types';

export const lamware = function<H extends Handler = Handler>(options: Options = {}) {
    // Set some defaults for root options.
    const logger = options.logger ?? console;
    const debug = options.debug ?? false;

    // Create the Middleware state.
    const { init, register, compileState, run, clear, wrap, logger: loggerOverride } = middleware<H>();

    // Create the Lamware instance.
    return {
        use(item, filter, sync = false) {
            // If provided, compile the filter with the Middleware filter.
            if (filter !== undefined) {
                if (item.filter === undefined) {
                    item.filter = filter;
                } else {
                    const originalFilter = typeof item.filter === 'function' ? item.filter : () => item.filter as boolean;
                    item.filter = () => (typeof filter === 'function' ? filter() : filter) && originalFilter();
                }
            }

            // Register the Middleware in to state.
            register(item, sync);

            return this;
        },
        useSync(item, filter) {
            return this.use(item, filter, true);
        },
        execute(handler) {
            // @ts-ignore TODO: Really need a better base instead of `Handler`...
            const wrappedHandler: H = async (event, context, callback) => {
                let response: PromiseType<Exclude<ReturnType<H>, void>>|Error;

                // Ensure the async initialization has completed.
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

                // Run the `before` Middleware and the Handler itself.
                try {
                    payload = await run('before', payload);

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

                // Run the `after` Middleware.
                const mixed = await run('after', {
                    ...basePayload,
                    response,
                });

                if (mixed.response instanceof Error) {
                    throw mixed.response;
                }

                // And finally, return the merged payload.
                return merge(response, mixed.response);
            };

            return {
                handler: wrappedHandler,
                getState: compileState,
                instance: this,
                clear,
            };
        },
    } as Instance<H>;
};

export * from './types';
