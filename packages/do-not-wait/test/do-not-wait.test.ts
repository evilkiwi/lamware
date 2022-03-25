import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { lamware, clearMiddleware } from '@lamware/core';
import { afterEach, expect, test } from 'vitest';
import { execute } from '@lamware/test';
import { doNotWait } from '../src';

afterEach(() => clearMiddleware());

test('should set callbackWaitsForEmptyEventLoop to false when used', async () => {
    let callbackValue: boolean|null = null;

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use(doNotWait())
        .execute(async ({ context }) => {
            callbackValue = context.callbackWaitsForEmptyEventLoop;

            return { statusCode: 200 };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(callbackValue).toBe(false);
});
