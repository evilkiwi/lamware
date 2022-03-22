import type { Handler, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { expect, test } from 'vitest';
import { execute } from './helpers';
import { lamware } from '../src';

test('should return a valid response', async () => {
    const { handler, clear } = lamware<APIGatewayProxyHandlerV2<any>>()
        .execute(async (event, context) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: 'world' }));

    clear();
});

test('should allow "after" middleware to mutate the response object', async () => {
    const { handler, clear } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            pure: true,
            after: async (payload) => {
                payload.response.body = JSON.stringify({ hello: 'world2' });
                return payload;
            },
        })
        .execute(async (event, context) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: 'world2' }));

    clear();
});

test('should allow "before" middleware to modify event/context', async () => {
    const { handler, clear } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            pure: true,
            before: async (payload) => {
                payload.event.rawPath = '/todo';
                return payload;
            },
        })
        .execute(async (event, context) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ rawPath: event.rawPath }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ rawPath: '/todo' }));

    clear();
});

test('should allow wrapping the handler once', async () => {
    const wrapper = (handler: Handler): APIGatewayProxyHandlerV2 => {
        return async (event, context, callback) => {
            const result = await handler(event, context, callback);
            result.statusCode = 401;

            return result;
        };
    };

    const { handler, clear } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            pure: true,
            wrap: wrapper,
        })
        .execute(async (event, context) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(401);
    expect(result.body).toBe(JSON.stringify({ hello: 'world' }));

    clear();
});

test('should allow wrapping the handler multiple times', async () => {
    const wrapper1 = (handler: Handler): APIGatewayProxyHandlerV2 => {
        return async (event, context, callback) => {
            const result = await handler(event, context, callback);
            result.statusCode = 401;

            return result;
        };
    };
    const wrapper2 = (handler: Handler): APIGatewayProxyHandlerV2 => {
        return async (event, context, callback) => {
            const result = await handler(event, context, callback);
            result.body = JSON.stringify({ hello: 'world2' });

            return result;
        };
    };
    const wrapper3 = (handler: Handler): APIGatewayProxyHandlerV2 => {
        return async (event, context, callback) => {
            const result = await handler(event, context, callback);
            result.statusCode = 400;

            return result;
        };
    };

    const { handler, clear } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            pure: true,
            wrap: wrapper1,
        })
        .use({
            id: 'test-2',
            pure: true,
            wrap: wrapper2,
        })
        .use({
            id: 'test-3',
            pure: true,
            wrap: wrapper3,
        })
        .execute(async (event, context) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(JSON.stringify({ hello: 'world2' }));

    clear();
});

test('should allow a middleware to exit early', async () => {
    let hasRun = false;

    const { handler, clear } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            pure: true,
            before: async (payload) => {
                payload.response = {
                    statusCode: 401,
                    body: 'Unauthorized',
                };

                return payload;
            },
        })
        .execute(async (event, context) => {
            hasRun = true;

            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(401);
    expect(hasRun).toBe(false);
    expect(result.body).toBe('Unauthorized');

    clear();
});

test('should allow middleware to initialize before executing', async () => {
    let hasRun = false;

    const { handler, clear } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            pure: true,
            init: async () => {
                await new Promise<void>(resolve => {
                    setTimeout(() => resolve(), 500);
                });
                hasRun = true;
            },
        })
        .execute(async (event, context) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: hasRun }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: true }));

    clear();
});
