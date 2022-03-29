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
