---
title: Middleware
head:
  - - meta
    - name: description
      content: Middleware is the core feature of Lamware
  - - meta
    - name: description
      content: Middleware is the core feature of Lamware
---

# Middleware

Lamware is built around the idea of Middleware being used to modify and transform a function. Middleware comes down to being a plain object, which can optionally define various hooks and wrappers.

## Official Middleware

We maintain some basic and useful Middleware over [in our GitHub repo](https://github.com/tnotifier/lamware/tree/master/packages). You can find them all there, but some noteworthy recommendations:

- [do-not-wait](https://github.com/tnotifier/lamware/tree/master/packages/do-not-wait) - Ensure `callbackWaitsForEmptyEventLoop` is set to `false` for your function
- [secrets-manager](https://github.com/tnotifier/lamware/tree/master/packages/secrets-manager) - Fetch & type secret values from AWS Secrets Manager
- [sentry](https://github.com/tnotifier/lamware/tree/master/packages/sentry) - Wrap your function for Sentry Issue tracking
- [warmer](https://github.com/tnotifier/lamware/tree/master/packages/warmer) - Warm your Lambda functions via `lambda-warmer`
- [appconfig](https://github.com/tnotifier/lamware/tree/master/packages/appconfig) - Fetch your JSON config from AWS AppConfig & type it
- [prisma](https://github.com/tnotifier/lamware/tree/master/packages/prisma) - Set-up and memoize your Prisma Client
- [fastify](https://github.com/tnotifier/lamware/tree/master/packages/fastify) - Set-up Fastify in Lambda implementing best practises and giving access to Lamware state

## Third-Party Middleware

::: tip Hmm
We don't have anything here yet. Want to add your own middleware? Open a PR!
:::

## Developing Middleware

Middleware is, at its core, just an object. You can use the `Middleware` type from `@lamware/core` to ensure things are typed correctly.

One important thing to note is that, whilst not required, providing a `Handler` type to the `Middleware` interface is recommended. It will properly type your hooks, as well as providing a type error should someone try to use your Middleware on an unsupported type.

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { Middleware } from '@lamware/core';

const myMiddleware = (): Middleware<APIGatewayProxyHandlerV2<any>> => ({
    id: 'my-middleware',
});
```

Alternatively, you can define middleware in-line with the `use()` function:

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { Middleware } from '@lamware/core';
import { lamware } from '@lamware/core';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    .use<Middleware<APIGatewayProxyHandlerV2<any>>>({
        id: 'my-middleware',
    })
    .execute(async () => {
        return { statusCode: 200 };
    });

export { handler };
```

### Hooks

Lamware provides two runtime hooks - `before` and `after`. As the name suggests, these hooks are ran **before** the function is executed, and **after** it has (but prior to resolving the result).

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { Middleware } from '@lamware/core';

const myMiddleware = (): Middleware<APIGatewayProxyHandlerV2<any>> => ({
    id: 'my-middleware',
    before: async (payload) => {
        // You can set state (see below)
        payload.state = { helloWorld = '123' };

        // Or return a response and exit the function early.
        payload.response = { statusCode: 401 };

        // You can also modify the function event and context.
        payload.event.rawPath = '/hello-world';
        payload.context.debug = true;

        return payload;
    },
    after: async (payload) => {
        // The response here is from the function itself, and you can modify it.
        payload.response.statusCode = 200;

        return payload;
    },
});
```

### State

Middleware is stateless, other than modifying its own custom state object, which will be merged in to the state used by the function. You can provide typings for this state, which will also be merged and used in the function handler.

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { Middleware } from '@lamware/core';

interface State {
    helloWorld: string;
}

const myMiddleware = (): Middleware<APIGatewayProxyHandlerV2<any>, State> => ({
    id: 'my-middleware',
    before: async (payload) => {
        payload.state = {
            helloWorld = '123',
        };

        return payload;
    },
});
```

### Initialization

Middleware can provide an `init` function which will be called before the Lambda function is executed. This is useful for memoizing instances in to state, fetching data from an API, or any other asynchronous operation.

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { Middleware } from '@lamware/core';

interface State {
    helloWorld: string;
}

const myMiddleware = (): Middleware<APIGatewayProxyHandlerV2<any>, State> => ({
    id: 'my-middleware',
    init: async () => {
        // Pull data from API etc.

        // You can also return your initial state here.
        return {
            helloWorld: '123',
        };
    },
});
```

### Wrapping the Handler

Sometimes you need to wrap your Handler, for example when using Sentry to allow it to capture handler errors. Through a Lamware middleware, you can provide a wrapper function that will automatically be used for the executed handler.

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { Middleware } from '@lamware/core';

const myMiddleware = (): Middleware<APIGatewayProxyHandlerV2<any>> => ({
    id: 'my-middleware',
    wrap: handler => handler,
});
```

In the cases where, for example Sentry, you have to provide a regular handler (`(event, context, callback) => {}`) instead of the object-based Lamware one, you can use our `wrapCompat` function to wrap using the compatibility wrapper:

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { Middleware } from '@lamware/core';
import { AWSLambda } from '@sentry/serverless';
import { wrapCompat } from '@lamware/core';

const myMiddleware = (): Middleware<APIGatewayProxyHandlerV2<any>> => ({
    id: 'my-middleware',
    wrap: handler => wrapCompat(handler, compatHandler => {
        return AWSLambda.wrapHandler(compatHandler, {
            captureTimeoutWarning: false,
            rethrowAfterCapture: true,
            callbackWaitsForEmptyEventLoop: false,
            ...(config?.wrapper ?? {}),
        });
    }),
});
```

### Filter

Sometimes you may want your Middleware to _not_ be registered, even if the user has added it via `.use()`. To achieve this, you can implement the **synchronous** `filter()` function:

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { Middleware } from '@lamware/core';

const myMiddleware = (): Middleware<APIGatewayProxyHandlerV2<any>> => ({
    id: 'my-middleware',
    filter: () => {
        return false; // Returning `false` will prevent the Middleware being registered.
    },
});
```
