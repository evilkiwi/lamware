import { wrapCompat, unwrapCompat } from '@tnotifier/lamware';
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
    init: async () => {
        try {
            AWSLambda.init(config?.config ?? {});
        } catch (e) {
            throw new Error(`failed to initialize sentry: ${e}`);
        }
    },
    wrap: handler => unwrapCompat(AWSLambda.wrapHandler(wrapCompat(handler), {
        captureTimeoutWarning: false,
        rethrowAfterCapture: true,
        callbackWaitsForEmptyEventLoop: false,
        ...(config?.wrapper ?? {}),
    })),
});
