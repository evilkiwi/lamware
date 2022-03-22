import type { Middleware } from '@tnotifier/lamware';
import { AWSLambda } from '@sentry/serverless';
import type * as Sentry from '@sentry/node';

export interface Config {
    wrapper?: AWSLambda.WrapperOptions;
    config?: Sentry.NodeOptions;
}

export const sentry = (config?: Config): Middleware => ({
    id: 'sentry',
    pure: true,
    wrap: handler => AWSLambda.wrapHandler(handler, {
        captureTimeoutWarning: false,
        rethrowAfterCapture: true,
        callbackWaitsForEmptyEventLoop: false,
        ...(config?.wrapper ?? {}),
    }),
    before: async (payload) => {
        AWSLambda.init(config?.config ?? {});

        return payload;
    },
});
