import type { Middleware } from '@tnotifier/lamware';
import { wrapCompat } from '@tnotifier/lamware';
import { AWSLambda } from '@sentry/serverless';
import type * as Sentry from '@sentry/node';

export interface Config {
    wrapper?: AWSLambda.WrapperOptions;
    config?: Sentry.NodeOptions;
}

export const sentry = (config?: Config): Middleware => ({
    id: 'sentry',
    pure: true,
    init: async () => {
        try {
            AWSLambda.init(config?.config ?? {});
        } catch (e) {
            throw new Error(`failed to initialize sentry: ${e}`);
        }
    },
    wrap: handler => wrapCompat(handler, compatHandler => {
        return AWSLambda.wrapHandler(compatHandler, {
            captureTimeoutWarning: false,
            rethrowAfterCapture: true,
            callbackWaitsForEmptyEventLoop: false,
            ...(config?.wrapper ?? {}),
        });
    }),
});
