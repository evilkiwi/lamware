import type { Handler, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { afterEach, expect, test } from 'vitest';
import { execute } from '@lamware/test';
import type { Wrapper, Middleware, Logger } from '../src';
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
        .use<Middleware<APIGatewayProxyHandlerV2<any>, { testing1234: boolean }>>({
            id: 'test-2',
            pure: true,
            init: async () => {
                return { testing1234: false };
            },
        })
        .execute(async ({ state }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: state.testing123, hello2: state.testing1234 }),
            };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: true, hello2: false }));
});

test('should allow middleware to access state set by init', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use<Middleware<APIGatewayProxyHandlerV2<any>, { testing123: boolean; testing1234: boolean }>>({
            id: 'test-1',
            pure: true,
            init: async () => ({ testing123: true }),
            before: async (payload) => {
                payload.state.testing1234 = payload.state.testing123;
                return payload;
            },
        })
        .execute(async ({ state }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: state.testing1234 }),
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
        return wrapCompat(handler, compatHandler => {
            return async (event, context, callback) => {
                const result = await compatHandler(event, context, callback);
                result.statusCode = 401;

                return result;
            };
        });
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

test('should allow wrapping handler with compatibility layer and passing state', async () => {
    const wrapper: Wrapper<APIGatewayProxyHandlerV2> = handler => {
        return wrapCompat(handler, compatHandler => {
            return async (event, context, callback) => {
                const result = await compatHandler(event, context, callback);
                result.statusCode = 401;

                return result;
            };
        });
    };

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use<Middleware<APIGatewayProxyHandlerV2<any>, { hello: string }>>({
            id: 'test-1',
            pure: true,
            wrap: wrapper,
            init: async () => ({ hello: 'world' }),
        })
        .execute(async ({ state }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: state.hello }),
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

test('should allow a custom logger to be manually set', async () => {
    let text = '';

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>({
            logger: {
                ...console,
                debug: (...args: unknown[]) => {
                    text = (args[0] as string|undefined) ?? '';
                },
            },
        })
        .execute(async ({ logger }) => {
            logger.debug('hello world');

            return { statusCode: 200 };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
    expect(text).toBe('hello world');
});

test('should allow middleware to set a custom logger', async () => {
    let text = '';

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use<Middleware<Handler, { customLogger: Logger }>>({
            id: 'test-2',
            pure: true,
            init: async () => ({
                customLogger: {
                    ...console,
                    debug: (...args: unknown[]) => {
                        text = (args[0] as string|undefined) ?? '';
                    },
                },
            }),
            logger: ({ customLogger }) => customLogger,
        })
        .execute(async ({ logger }) => {
            logger.debug('hello world');

            return { statusCode: 200 };
        });
    const result = await execute(handler);

    expect(result.statusCode).toBe(200);
    expect(text).toBe('hello world');
});
