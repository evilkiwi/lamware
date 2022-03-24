import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { afterEach, expect, test } from 'vitest';
import { execute } from './helpers';
import { Wrapper, Middleware, unwrapCompat } from '../src';
import { lamware, wrapCompat } from '../src';
import { clear } from '../src/middleware';

afterEach(() => clear());

test('should return a valid response', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: 'world' }));
});

test('should allow "after" middleware to mutate the response object', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            pure: true,
            after: async (payload) => {
                payload.response.body = JSON.stringify({ hello: 'world2' });
                return payload;
            },
        })
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: 'world2' }));
});

test('should allow "before" middleware to modify event/context', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            pure: true,
            before: async (payload) => {
                payload.event.rawPath = '/todo';
                return payload;
            },
        })
        .execute(async ({ event }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ rawPath: event.rawPath }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ rawPath: '/todo' }));
});

test('should allow wrapping the handler once', async () => {
    const wrapper: Wrapper<APIGatewayProxyHandlerV2> = handler => {
        return async (payload) => {
            const result = await handler(payload);
            result.statusCode = 401;

            return result;
        };
    };

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            pure: true,
            wrap: wrapper,
        })
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(401);
    expect(result.body).toBe(JSON.stringify({ hello: 'world' }));
});

test('should allow wrapping the handler multiple times', async () => {
    const wrapper1: Wrapper<APIGatewayProxyHandlerV2> = handler => {
        return async (payload) => {
            const result = await handler(payload);
            result.statusCode = 401;

            return result;
        };
    };
    const wrapper2: Wrapper<APIGatewayProxyHandlerV2> = handler => {
        return async (payload) => {
            const result = await handler(payload);
            result.body = JSON.stringify({ hello: 'world2' });

            return result;
        };
    };
    const wrapper3: Wrapper<APIGatewayProxyHandlerV2> = handler => {
        return async (payload) => {
            const result = await handler(payload);
            result.statusCode = 400;

            return result;
        };
    };

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
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
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(JSON.stringify({ hello: 'world2' }));
});

test('should allow a middleware to exit early', async () => {
    let hasRun = false;

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
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
        .execute(async (payload) => {
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
});

test('should allow middleware to initialize before executing', async () => {
    let hasRun = false;

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
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
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: hasRun }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: true }));
});

test('should allow middleware to initialize with global state', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use<Middleware<APIGatewayProxyHandlerV2<any>, { testing123: boolean }>>({
            id: 'test-1',
            pure: true,
            init: async () => {
                return { testing123: true };
            },
        })
        .execute(async ({ state }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: state.testing123 }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: true }));
});

test('should allow middleware to modify a global state', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use<Middleware<APIGatewayProxyHandlerV2<any>, { testing123: boolean }>>({
            id: 'test-1',
            pure: true,
            before: async (payload) => {
                payload.state = { testing123: true };
                return payload;
            },
        })
        .execute(async ({ state }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: state.testing123 }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: true }));
});

test('should allow wrapping handler with compatibility layer', async () => {
    const wrapper: Wrapper<APIGatewayProxyHandlerV2> = handler => {
        return async ({ event, context, callback }) => {
            const result = await wrapCompat(handler)(event, context, callback);
            result.statusCode = 401;

            return result;
        };
    };

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            pure: true,
            wrap: wrapper,
        })
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(401);
    expect(result.body).toBe(JSON.stringify({ hello: 'world' }));
});

test('should allow wrapping and unwrapping handler with compatibility layer', async () => {
    const wrapper: Wrapper<APIGatewayProxyHandlerV2> = handler => {
        return unwrapCompat(wrapCompat(async (payload) => {
            const result = await handler(payload);
            result.statusCode = 401;

            return result;
        }));
    };

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            pure: true,
            wrap: wrapper,
        })
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(401);
    expect(result.body).toBe(JSON.stringify({ hello: 'world' }));
});

test('should throw errors emitted by the handler', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .execute(async (payload) => {
            throw new Error('debug');
        });

    await expect(execute(handler)).rejects.toThrowError();
});

test('should allow middleware filter at runtime', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            pure: true,
            after: async (payload) => {
                payload.response.statusCode = 400;
                return payload;
            },
        }, () => false)
        .execute(async ({ event }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ rawPath: event.rawPath }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
});

test('should allow middleware self filtering', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            pure: true,
            after: async (payload) => {
                payload.response.statusCode = 400;
                return payload;
            },
            filter: () => false,
        })
        .execute(async ({ event }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ rawPath: event.rawPath }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
});

test('should allow both middleware self filtering and runtime filtering', async () => {
    const { handler: handler1 } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            pure: true,
            after: async (payload) => {
                payload.response.statusCode = 400;
                return payload;
            },
            filter: () => true,
        }, () => false)
        .execute(async ({ event }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ rawPath: event.rawPath }),
            };
        });
    const result1 = await execute(handler1);

    const { handler: handler2 } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-2',
            pure: true,
            after: async (payload) => {
                payload.response.statusCode = 400;
                return payload;
            },
            filter: () => false,
        }, () => true)
        .execute(async ({ event }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ rawPath: event.rawPath }),
            };
        });
    const result2 = await execute(handler2);

    expect(result1.statusCode).toBe(200);
    expect(result2.statusCode).toBe(200);
});
