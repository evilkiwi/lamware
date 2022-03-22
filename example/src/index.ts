import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { doNotWait } from '@tnotifier/lamware-do-not-wait';
import { appconfig } from '@tnotifier/lamware-appconfig';
import { sentry } from '@tnotifier/lamware-sentry';
import { warmer } from '@tnotifier/lamware-warmer';
import { lamware } from '@tnotifier/lamware';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    .use(doNotWait())
    .use(appconfig({
        app: 'tnotifier/api',
        env: 'production',
        config: 'production',
    }))
    .use(sentry({
        config: {
            dsn: 'my-sentry-dsn',
        },
    }))
    .use(warmer())
    .execute(async (event, context) => {
        return {
            statusCode: 200,
            body: JSON.stringify({
                hello: 'world',
                path: event.rawPath,
            }),
        };
    });

export { handler };
