import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { Middleware } from '@lamware/core';
import { wrapCompat } from '@lamware/core';
import { ApiHandler } from 'sst/node/api';

export const sst = (): Middleware<APIGatewayProxyHandlerV2> => ({
  id: 'sst',
  wrap: handler => wrapCompat(handler, compatHandler => {
    return ApiHandler(compatHandler as Parameters<typeof ApiHandler>[0]);
  }),
});
