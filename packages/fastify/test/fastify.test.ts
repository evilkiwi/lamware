import type { Middleware, LamwareState } from '@lamware/core';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { lamware, clearMiddleware } from '@lamware/core';
import { afterEach, expect, test } from 'vitest';
import { execute } from '@lamware/test';
import createFastify from 'fastify';
import { fastify } from '../src';

afterEach(() => clearMiddleware());

test('should allow constructing basic endpoints', async () => {
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

test('should pass state to the request handlers', async () => {
    const { instance, handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use<Middleware<APIGatewayProxyHandlerV2<any>, { helloWorld: string }>>({
            id: 'test-1',
            init: async () => ({
                helloWorld: '123',
            }),
        })
        .use(fastify(app => {
            app.get('/', (request, reply) => {
                reply.send({ hello: (request.state as LamwareState<typeof instance>).helloWorld });
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
    expect(result.body).toStrictEqual(JSON.stringify({ hello: '123' }));
});

test('should allow disabling request state injection', async () => {
    const { instance, handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use<Middleware<APIGatewayProxyHandlerV2<any>, { helloWorld: string }>>({
            id: 'test-1',
            init: async () => ({
                helloWorld: '123',
            }),
        })
        .use(fastify(app => {
            app.get('/', (request, reply) => {
                reply.send({ hello: (request.state as LamwareState<typeof instance>).helloWorld ?? '456' });
            });

            return app;
        }, { attachState: false }))
        .execute(async (payload) => {
            return payload.state.fastifyHandler(payload);
        });

    const result = await execute(handler, 'apiGateway', {
        method: 'GET',
        path: '/',
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toStrictEqual(JSON.stringify({ hello: '456' }));
});

test('should allow enforcing ready state', async () => {
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

test('should allow passing an existing fastify client', async () => {
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
