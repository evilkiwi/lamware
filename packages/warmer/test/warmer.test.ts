import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { lamware } from '@lamware/core';
import { execute } from '@lamware/test';
import { expect, test } from 'vitest';
import { warmer } from '../src';

test('should execute given a non-warming event', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use(warmer())
        .execute(async () => {
            return { statusCode: 200 };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toEqual(200);
});

test('should exit early given a warming event', async () => {
    let handlerExecuted = false;

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use(warmer())
        .execute(async () => {
            handlerExecuted = true;
            return { statusCode: 200 };
        });
    const result = await execute(handler, 'apiGateway', {
        override: {
            warmer: true,
            concurrency: 1,
        },
    });

    expect(result).toEqual('warmed');
    expect(handlerExecuted).toEqual(false);
});
