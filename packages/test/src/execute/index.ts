import type { Handler, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { execute as executeLambda } from 'lambda-local';
import { merge } from 'merge-anything';
import { createHash } from 'crypto';
import { v4 as uuid } from 'uuid';
import type { ApiGatewayOptions, EventOptions, EventType, SqsOptions } from './types';
import { events } from './events';

export const execute = async <H extends Handler = APIGatewayProxyHandlerV2, E extends EventType = 'apiGateway'>(handler: H, eventType: E, options: EventOptions[E] = {}) => {
  let event: any = events[eventType];

  switch (eventType) {
    case 'apiGateway': {
      const localOptions = options as ApiGatewayOptions;

      event.path = localOptions.path ?? '/';
      event.requestContext.resourcePath = localOptions.path ?? '/';
      event.resource = localOptions.path ?? '/';
      event.headers = localOptions.headers ?? {};
      event.requestContext.httpMethod = localOptions.method ?? 'GET';
      event.httpMethod = localOptions.method ?? 'GET';
      event.queryStringParameters = localOptions.query ?? {};
      event.body = JSON.stringify(localOptions.body ?? {});
      break;
    }
    case 'apiGatewayV2': {
      const localOptions = options as ApiGatewayOptions;

      // TODO:
      break;
    }
    case 'sqs': {
      const localOptions = options as SqsOptions;

      event.Records = (localOptions.items ?? []).map(item => ({
        messageId: uuid(),
        receiptHandle: uuid(),
        body: JSON.stringify(item),
        attributes: {
          ApproximateReceiveCount: 1,
          SentTimestamp: (new Date()).getTime(),
          SenderId: 'AIDAIENQZJOLO23YVJ4VO',
          ApproximateFirstReceiveTimestamp: (new Date()).getTime(),
        },
        messageAttributes: {},
        md5OfBody: createHash('md5').update(JSON.stringify(item)).digest('hex'),
        eventSource: 'aws:sqs',
        eventSourceARN: 'arn:aws:sqs:us-east-2:123456789012:my-queue',
        awsRegion: 'us-east-2',
      })) as any;
      break;
    }
  }

  if (options.override) {
    event = merge(event, options.override);
  }

  const result = await executeLambda({
    region: 'us-east-2',
    lambdaFunc: { handler },
    lambdaHandler: 'handler',
    timeoutMs: 30000,
    verboseLevel: 0,
    environment: {
      STAGE: 'development',
    },
    event,
  });

  return result as NonNullable<ReturnType<H>>;
};
