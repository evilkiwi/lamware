import type { LamwareState, Middleware } from '@lamware/core';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { lamware } from '@lamware/core';
import { execute } from '@lamware/test';
import { expect, test } from 'vitest';
import createFastify from 'fastify';
import { fastify } from '../src';

test.concurrent('should allow constructing basic endpoints', async () => {
  const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    .use(fastify(app => {
      app.get('/', (request, reply) => {
        reply.send({ hello: 'world' });
      });

      return app;
    }))
    .execute(async (payload) => {
      return payload.state.fastifyHandler(payload);
    });

  const result = await execute(handler, 'apiGateway', {
    method: 'GET',
    path: '/',
  });

  expect(result.statusCode).toBe(200);
  expect(result.body).toStrictEqual(JSON.stringify({ hello: 'world' }));
});

test.concurrent('should allow enforcing ready state', async () => {
  const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    .use(fastify(app => {
      app.get('/', (request, reply) => {
        reply.send({ hello: 'world' });
      });

      return app;
    }, { enforceReady: true }))
    .execute(async (payload) => {
      return payload.state.fastifyHandler(payload);
    });

  const result = await execute(handler, 'apiGateway', {
    method: 'GET',
    path: '/',
  });

  expect(result.statusCode).toBe(200);
  expect(result.body).toStrictEqual(JSON.stringify({ hello: 'world' }));
});

test.concurrent('should allow passing an existing fastify client', async () => {
  const client = createFastify();
  client.get('/', (request, reply) => {
    reply.send({ hello: 'world' });
  });

  const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    .use(fastify(undefined, { client }))
    .execute(async (payload) => {
      return payload.state.fastifyHandler(payload);
    });

  const result = await execute(handler, 'apiGateway', {
    method: 'GET',
    path: '/',
  });

  expect(result.statusCode).toBe(200);
  expect(result.body).toStrictEqual(JSON.stringify({ hello: 'world' }));
});

test.concurrent('should allow accessing state from the request', async () => {
  const client = createFastify();
  client.get('/', (request, reply) => {
    const state = request.state as State;
    reply.send({ hello: state.x });
  });

  type State = LamwareState<typeof instance>;

  const { instance, handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    .use<Middleware<APIGatewayProxyHandlerV2, { x: boolean; }>>({
      id: 'test-1',
      init: async () => ({ x: true }),
    })
    .useSync(fastify(undefined, { client }))
    .execute(async (payload) => {
      return payload.state.fastifyHandler(payload);
    });

  const result = await execute(handler, 'apiGateway', {
    method: 'GET',
    path: '/',
  });

  expect(result.statusCode).toBe(200);
  expect(result.body).toStrictEqual(JSON.stringify({ hello: true }));
});
