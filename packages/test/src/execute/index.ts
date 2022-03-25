import type { Handler, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { execute as executeLambda } from 'lambda-local';
import { createHash } from 'crypto';
import { v4 as uuid } from 'uuid';
import * as events from '@/../../../build/events';
import type { ApiGatewayOptions, EventOptions, EventType, Options, SqsOptions } from './types';

export const execute = async <H extends Handler = APIGatewayProxyHandlerV2, E extends EventType = 'apiGateway'>(handler: H, eventType: E, options: EventOptions[E] = {}) => {
    let event: any = {...events[eventType]};

    switch (eventType) {
        case 'apiGateway': {
            const localEvent = event as typeof events.apiGateway;
            const localOptions = options as ApiGatewayOptions;

            localEvent.headers = localOptions.headers ?? {};
            localEvent.requestContext.httpMethod = localOptions.method ?? 'GET';
            localEvent.httpMethod = localOptions.method ?? 'GET';
            localEvent.queryStringParameters = localOptions.query ?? {};
            localEvent.body = JSON.stringify(localOptions.body ?? {});

            event = localEvent;
            break;
        }
        case 'apiGatewayV2': {
            const localEvent = event as typeof events.apiGatewayV2;
            const localOptions = options as ApiGatewayOptions;

            // TODO:

            event = localEvent;
            break;
        }
        case 'sqs': {
            const localEvent = event as typeof events.sqs;
            const localOptions = options as SqsOptions;

            localEvent.Records = (localOptions.items ?? []).map(item => ({
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

            event = localEvent;
            break;
        }
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
