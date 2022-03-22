import type { Handler, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { execute as executeLambda } from 'lambda-local';
import apiGateway from '../../../../../build/events/api-gateway';
import type { ExecuteOptions } from './types';

export const execute = async (handler: Handler, options: ExecuteOptions = {}) => {
    const event = {...apiGateway};
    event.headers = options.headers ?? {};
    event.requestContext.httpMethod = options.method ?? 'GET';
    event.httpMethod = options.method ?? 'GET';
    event.queryStringParameters = options.query ?? {};
    event.body = JSON.stringify(options.body ?? {});

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

    return result as APIGatewayProxyStructuredResultV2;
};
