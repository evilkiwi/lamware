import type { Handler } from 'aws-lambda';
import { merge } from 'merge-anything';
import type { BeforeMiddlewarePayload } from '../middleware';
import type { PromiseType } from '../types';
import { middleware } from '../middleware';
import type { Instance, Options } from './types';

export const lamware = function<H extends Handler = Handler>(options: Options = {}) {
  // Set some defaults for root options.
  const logger = options.logger ?? console;
  const debug = options.debug ?? false;

  // Create the Middleware state.
  const { init, register, has, compileState, run, clear, wrap, logger: loggerOverride } = middleware<H>();

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

        // Create the base Middleware payload for mutating.
        let payload: BeforeMiddlewarePayload<H> = {
          debug,
          logger: localLogger,
          state: compileState(),
          event,
          context,
        };

        // Run the `before` Middleware and the Handler itself.
        try {
          payload = await run('before', payload);

          if (payload.response === undefined) {
            response = await wrap(handler)({
              event: payload.event,
              context: payload.context,
              logger: localLogger,
              state: compileState(),
              callback,
            });
          } else {
            response = payload.response;
          }

          // Run the `after` Middleware.
          const mixed = await run('after', {
            ...payload,
            response,
          });

          // Merge the `after` response.
          response = merge(response, mixed.response);
        } catch (e) {
          response = e as Error;
        }

        if (response instanceof Error) {
          if (has('uncaughtException')) {
            try {
              // Run the exception hooks.
              const mixed = await run('uncaughtException', {
                ...payload,
                response: {},
                cause: {
                  exception: response,
                },
              });

              // Set the response to an empty object or whatever mutated response `uncaughtException` cooked up.
              response = mixed.response;
            } catch (e) {
              response = e as Error;
            }
          }

          // If it's _still_ uncaught, throw it top-level.
          if (response instanceof Error) {
            throw response;
          }
        }

        return response;
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
