import type { Handler, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { execute } from '@lamware/test';
import { expect, test } from 'vitest';
import { Wrapper, Middleware, Logger } from '../src';
import { lamware, wrapCompat } from '../src';

const sleep = (length: number) => new Promise<void>(resolve => {
    setTimeout(() => resolve(), length);
});

test.concurrent('should return a valid response', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: 'world' }));
});

test.concurrent('should allow `after` middleware to mutate the response object', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
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
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: 'world2' }));
});

test.concurrent('should allow "before" middleware to modify event/context', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
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
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ rawPath: '/todo' }));
});

test.concurrent('should allow wrapping the handler once', async () => {
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
            wrap: wrapper,
        })
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(401);
    expect(result.body).toBe(JSON.stringify({ hello: 'world' }));
});

test.concurrent('should allow wrapping the handler multiple times', async () => {
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
            wrap: wrapper1,
        })
        .use({
            id: 'test-2',
            wrap: wrapper2,
        })
        .use({
            id: 'test-3',
            wrap: wrapper3,
        })
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe(JSON.stringify({ hello: 'world2' }));
});

test.concurrent('should allow a middleware to exit early', async () => {
    let hasRun = false;

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
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
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(401);
    expect(hasRun).toBe(false);
    expect(result.body).toBe('Unauthorized');
});

test.concurrent('should allow middleware to initialize before executing', async () => {
    let hasRun = false;

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
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
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: true }));
});

test.concurrent('should allow middleware to initialize with global state', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use<Middleware<APIGatewayProxyHandlerV2<any>, { testing123: boolean }>>({
            id: 'test-1',
            init: async () => {
                return { testing123: true };
            },
        })
        .use<Middleware<APIGatewayProxyHandlerV2<any>, { testing1234: boolean }>>({
            id: 'test-2',
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
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: true, hello2: false }));
});

test.concurrent('should allow middleware to access state set by init', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use<Middleware<APIGatewayProxyHandlerV2<any>, { testing123: boolean; testing1234: boolean }>>({
            id: 'test-1',
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
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: true }));
});

test.concurrent('should allow middleware to modify a global state', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use<Middleware<APIGatewayProxyHandlerV2<any>, { testing123: boolean }>>({
            id: 'test-1',
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
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: true }));
});

test.concurrent('should allow wrapping handler with compatibility layer', async () => {
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
            wrap: wrapper,
        })
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(401);
    expect(result.body).toBe(JSON.stringify({ hello: 'world' }));
});

test.concurrent('should allow wrapping handler with compatibility layer and passing state', async () => {
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
            wrap: wrapper,
            init: async () => ({ hello: 'world' }),
        })
        .execute(async ({ state }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: state.hello }),
            };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(401);
    expect(result.body).toBe(JSON.stringify({ hello: 'world' }));
});

test.concurrent('should allow middleware filter at runtime', async () => {
    let didRun = false;

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            init: async () => {
                didRun = true;
            },
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
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(didRun).toBe(false);
});

test.concurrent('should allow middleware filter at runtime with a boolean', async () => {
    let didRun = false;

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            init: async () => {
                didRun = true;
            },
            after: async (payload) => {
                payload.response.statusCode = 400;
                return payload;
            },
        }, false)
        .execute(async ({ event }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ rawPath: event.rawPath }),
            };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(didRun).toBe(false);
});

test.concurrent('should allow middleware self filtering', async () => {
    let didRun = false;

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            init: async () => {
                didRun = true;
            },
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
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(didRun).toBe(false);
});

test.concurrent('should allow both middleware self filtering and runtime filtering', async () => {
    let didRun = false;

    const { handler: handler1 } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            init: async () => {
                didRun = true;
            },
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
    const result1 = await execute(handler1, 'apiGateway');

    const { handler: handler2 } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-2',
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
    const result2 = await execute(handler2, 'apiGateway');

    expect(result1.statusCode).toBe(200);
    expect(result2.statusCode).toBe(200);
    expect(didRun).toBe(false);
});

test.concurrent('should allow both middleware self filtering and runtime filtering with mixed filter types', async () => {
    let didRun = false;

    const { handler: handler1 } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            init: async () => {
                didRun = true;
            },
            after: async (payload) => {
                payload.response.statusCode = 400;
                return payload;
            },
            filter: true,
        }, () => false)
        .execute(async ({ event }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ rawPath: event.rawPath }),
            };
        });
    const result1 = await execute(handler1, 'apiGateway');

    const { handler: handler2 } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-2',
            after: async (payload) => {
                payload.response.statusCode = 400;
                return payload;
            },
            filter: () => false,
        }, true)
        .execute(async ({ event }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ rawPath: event.rawPath }),
            };
        });
    const result2 = await execute(handler2, 'apiGateway');

    expect(result1.statusCode).toBe(200);
    expect(result2.statusCode).toBe(200);
    expect(didRun).toBe(false);
});

test.concurrent('should allow a custom logger to be manually set', async () => {
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
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(text).toBe('hello world');
});

test.concurrent('should allow middleware to set a custom logger', async () => {
    let text = '';

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use<Middleware<Handler, { customLogger: Logger }>>({
            id: 'test-2',
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
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(text).toBe('hello world');
});

test.concurrent('should re-throw errors that happen during middleware `init`', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use<Middleware<APIGatewayProxyHandlerV2<any>>>({
            id: 'test-1',
            init: async () => {
                throw new Error('Debug');
            },
        })
        .execute(async () => {
            return { statusCode: 200 };
        });

    await expect(() => execute(handler, 'apiGateway')).rejects.toThrowError();
});

test.concurrent('should break initialization chain for `useSync()` Middleware', async () => {
    const runTimes: [number, number, number, number] = [0, 0, 0, 0];

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            init: async () => {
                runTimes[0] = (new Date()).getTime();
            },
        })
        .use({
            id: 'test-2',
            init: async () => {
                runTimes[1] = (new Date()).getTime();
            },
        })
        .useSync({
            id: 'test-3',
            init: async () => {
                runTimes[2] = (new Date()).getTime();
                await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
            },
        })
        .use({
            id: 'test-4',
            init: async () => {
                runTimes[3] = (new Date()).getTime();
            },
        })
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: 'world' }));
    expect(runTimes[1] - runTimes[0]).toBeLessThanOrEqual(10);
    expect(runTimes[3] - runTimes[2]).toBeGreaterThanOrEqual(199);
});

test.concurrent('should allow `useSync()` Middleware first', async () => {
    const runTimes: [number, number, number] = [0, 0, 0];

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .useSync({
            id: 'test-1',
            init: async () => {
                runTimes[0] = (new Date()).getTime();
                await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
            },
        })
        .use({
            id: 'test-2',
            init: async () => {
                runTimes[1] = (new Date()).getTime();
            },
        })
        .use({
            id: 'test-3',
            init: async () => {
                runTimes[2] = (new Date()).getTime();
            },
        })
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: 'world' }));
    expect(runTimes[2] - runTimes[1]).toBeLessThanOrEqual(10);
    expect(runTimes[1] - runTimes[0]).toBeGreaterThanOrEqual(199);
});

test.concurrent('should allow `useSync()` Middleware last', async () => {
    const runTimes: [number, number, number] = [0, 0, 0];

    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            init: async () => {
                runTimes[0] = (new Date()).getTime();
            },
        })
        .use({
            id: 'test-2',
            init: async () => {
                runTimes[1] = (new Date()).getTime();
            },
        })
        .useSync({
            id: 'test-3',
            init: async () => {
                await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
                runTimes[2] = (new Date()).getTime();
            },
        })
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: 'world' }));
    expect(runTimes[1] - runTimes[0]).toBeLessThanOrEqual(10);
    expect(runTimes[2] - runTimes[1]).toBeGreaterThanOrEqual(199);
});

test.concurrent('should allow Middleware to access in-progress state', async () => {
    const { handler, getState } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use<Middleware<APIGatewayProxyHandlerV2<any>, { test: string }>>({
            id: 'test-1',
            init: async () => ({ test: 'hello!' }),
        })
        .useSync<Middleware<APIGatewayProxyHandlerV2<any>, { test2: string }>>({
            id: 'test-2',
            init: async () => {
                return { test2: getState().test };
            },
        })
        .execute(async ({ state }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: state.test2 }),
            };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: 'hello!' }));
});

test.concurrent('should allow init to fetch injected state', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use<Middleware<APIGatewayProxyHandlerV2<any>, { test: string }>>({
            id: 'test-1',
            init: async () => ({ test: 'hello!' }),
        })
        .useSync<Middleware<APIGatewayProxyHandlerV2<any>, { test2: string }>>({
            id: 'test-2',
            init: async (state) => {
                // @ts-expect-error
                return { test2: state().test };
            },
        })
        .execute(async ({ state }) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: state.test2 }),
            };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify({ hello: 'hello!' }));
});

test.concurrent('should throw top-level error if no uncaughtException middleware is present', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .execute(async (payload) => {
            throw new Error('debug');
        });

    await expect(() => execute(handler, 'apiGateway')).rejects.toThrowError();
});

test.concurrent('should not throw top-level error if an uncaughtException middleware is present', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            uncaughtException: async (payload) => {
                return payload;
            },
        })
        .execute(async (payload) => {
            throw new Error('debug');
        });
    const result = await execute(handler, 'apiGateway');

    expect(result).toEqual({});
});

test.concurrent('should execute uncaughtException for `before` hook exceptions', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            before: async () => {
                throw new Error('Testing');
            },
        })
        .use({
            id: 'test-2',
            uncaughtException: async (payload) => {
                payload.response = {
                    statusCode: 200,
                    body: JSON.stringify({ hello: 'world2' }),
                };

                return payload;
            },
        })
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.body).toBe(JSON.stringify({ hello: 'world2' }));
});

test.concurrent('should execute uncaughtException for `after` hook exceptions', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            after: async () => {
                throw new Error('Testing');
            },
        })
        .use({
            id: 'test-2',
            uncaughtException: async (payload) => {
                payload.response = {
                    statusCode: 200,
                    body: JSON.stringify({ hello: 'world2' }),
                };

                return payload;
            },
        })
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.body).toBe(JSON.stringify({ hello: 'world2' }));
});

test.concurrent('should allow asynchronous clean-up through an uncaughtException middleware', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            after: async () => {
                throw new Error('Testing');
            },
        })
        .use({
            id: 'test-2',
            uncaughtException: async (payload) => {
                await sleep(500);

                payload.response = {
                    statusCode: 200,
                    body: JSON.stringify({ hello: 'world2' }),
                };

                return payload;
            },
        })
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });
    const result = await execute(handler, 'apiGateway');

    expect(result.body).toBe(JSON.stringify({ hello: 'world2' }));
});

test.concurrent('should throw top-level error if throwing an uncaught exception during uncaughtException hook', async () => {
    const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
        .use({
            id: 'test-1',
            after: async () => {
                throw new Error('Testing');
            },
        })
        .use({
            id: 'test-2',
            uncaughtException: async (payload) => {
                throw new Error('Testing');
            },
        })
        .execute(async (payload) => {
            return {
                statusCode: 200,
                body: JSON.stringify({ hello: 'world' }),
            };
        });

    await expect(() => execute(handler, 'apiGateway')).rejects.toThrowError();
});
