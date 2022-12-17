import { powertoolsTracing } from '@lamware/powertools-tracing';
import { powertoolsLogger } from '@lamware/powertools-logger';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { doNotWait } from '@lamware/do-not-wait';
import { appconfig } from '@lamware/appconfig';
import { sentry } from '@lamware/sentry';
import { warmer } from '@lamware/warmer';
import { lamware } from '@lamware/core';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
  .use(doNotWait())
  .use(powertoolsTracing({
    serviceName: 'lamware-example',
  }))
  .use(powertoolsLogger({
    serviceName: 'lamware-example',
    logLevel: 'DEBUG',
  }))
  .use(appconfig<{ hello: string }>({
    app: 'evilkiwi-lamware-example',
    env: 'production',
    config: 'production',
  }))
  .use(sentry({
    config: {
      dsn: 'https://d99b0b41329e46b18f006e70157c5e05@o1080839.ingest.sentry.io/6274520',
    },
  }))
  .use(warmer())
  .execute(async ({ state }) => {
    return {
      statusCode: 200,
      body: JSON.stringify({
        hello: 'world',
        appconfig: state.config,
      }),
    };
  });

export { handler };
