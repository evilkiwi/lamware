import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { lamware } from '@lamware/core';
import { execute } from '@lamware/test';
import { expect, test } from 'vitest';
import { doNotWait } from '../src';

test.concurrent('should set callbackWaitsForEmptyEventLoop to false when used', async () => {
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
