---
title: Usage
head:
  - - meta
  - name: description
    content: Learn how to use Lamware in a Function
  - - meta
  - name: description
    content: Learn how to use Lamware in a Function
---

# Usage

"Getting Started" showed you how to create a function using the new Lamware context, but there are some additional things built-in to Lamware that you should know about!

## Middleware Filtering

Sometimes you don't want a middleware to run - for example, not running `sentry` in a development environment. To achieve this, you can provide a **synchronous** filter function to the `.use()` call:

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { sentry } from '@lamware/sentry';
import { lamware } from '@lamware/core';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
  .use(sentry({
    config: {
      dsn: 'my-sentry-dsn',
    },
  }), () => {
    return process.env.NODE_ENV === 'production';
  })
  .execute(async () => {
    return { statusCode: 200 };
  });

export { handler };
```

## Logger

Provided via the `logger` payload item, and by default using `console`, you should use this logger as an alternative raw `console.log()`. Middleware you use can override this logger, providing you with easy integration. For example, the [powertools-logger](https://github.com/evilkiwi/lamware/tree/master/packages/powertools-logger) middleware makes `logger` an official NodeJS Lambda logger:

```typescript
import { powertoolsLogger } from '@lamware/powertools-logger';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { lamware } from '@lamware/core';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
  .use(powertoolsLogger({
    serviceName: 'lamware-example',
    logLevel: 'DEBUG',
  }))
  .execute(async ({ logger }) => {
    logger.error('Hello world!');

    return { statusCode: 200 };
  });

export { handler };
```

## Initialization Order

The order in which you `.use()` Middleware is important - since it is the order in which it will run hooks and initialize.

By default, **all middleware registered via `.use()` will initialize in parallel.** Since most Middleware doesn't rely on state from other Middleware, this works great and helps with cold-start performance. However, should you need to use state from other Middleware, you can register Middleware with the `.useSync()` registrar.

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { lamware, state } from '@lamware/core';
import { appconfig } from '@lamware/appconfig';
import { memoize } from '@lamware/memoize';
import { sentry } from '@lamware/sentry';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
  .use(appconfig<{ test: boolean }>({
    app: 'evilkiwi-lamware-example',
    env: 'production',
    config: 'production',
  }))
  /**
   * Instead of initializing this Middleware at the same time as the
   * previous Middleware, it creates a break in the chain and initializes
   * alone _after_ the previous middleware but _before_ any of the following
   * Middleware.
   */
  .useSync(memoize('test', async (getState) => {
    /**
     * Since we know for sure AppConfig has loaded at this point, we can
     * safely use the state.
     */
    const myState = getState();

    if (myState.config.test) {
      throw new Error('oops!');
    }
  }))
  .use(sentry({
    config: {
      dsn: 'my-sentry-dsn',
    },
  }))
  .execute(async ({ logger }) => {
    logger.error('Hello world!');

    return { statusCode: 200 };
  });

export { handler };
```

## Consuming State

If defining Middleware in-line, you can consume the current Lamware state defined before your own Middleware is executed. This is exceptionally useful for edge-cases where you need to split-up a Middleware chain using `useSync` for your own custom logic, for example.

This is a **huge** gray-area for the following reasons:

1. There is no defined way of providing full TypeScript typings to partial, mid-chain state
2. The state that is available is based on the execution order (and [a]synchronous nature) of the Middleware you use

Regardless, the `init` method in your Middleware has a state getter passed as the first parameter - which, when called, will return the current state at that moment in time.

See the [above example](#initialization-order) to understand exactly how this works with the generic `memoize` middleware.
