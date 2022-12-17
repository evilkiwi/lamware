import type { APIGatewayProxyHandlerV2, Handler } from 'aws-lambda';
import { powertoolsTracing } from '@lamware/powertools-tracing';
import { powertoolsLogger } from '@lamware/powertools-logger';
import { doNotWait } from '@lamware/do-not-wait';
import { appconfig } from '@lamware/appconfig';
import { sentry } from '@lamware/sentry';
import { warmer } from '@lamware/warmer';
import { lamware } from '@lamware/core';

export const setup = <H extends Handler = APIGatewayProxyHandlerV2<any>>() => {
  return lamware<H>()
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
    .use(warmer());
};
