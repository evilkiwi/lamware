---
title: Getting Started
head:
  - - meta
    - name: description
      content: Get started using Lamware for AWS Lambda
  - - meta
    - name: description
      content: Get started using Lamware for AWS Lambda
---

# Getting Started

## Installing

Lamware is distributed via NPM and can be installed via `@lamware/core`:

```bash
yarn add @lamware/core

# or

npm install --save @lamware/core
```

## Basics

`@lamware/core` exposes the `lamware` function, which is the root of the framework. It returns a handler, which you should export for Lambda, and allows chaining middleware and eventually writing your function code.

```typescript
import { lamware } from '@lamware/core';

const { handler } = lamware().execute(async () => {
    return { statusCode: 200 };
});

export { handler };
```

It's worth noting that the handler you define in `execute()` uses a new handler format.

Instead of `(event, context, callback) => {}`, the new format passes a single object for you to destructure; `({ event, context, callback }) => {}` which, among being cleaner to use, allows Lamware to inject various other states in to the handler for you to use.

### Typing

Using [`aws-lambda`](https://www.npmjs.com/package/@types/aws-lambda) typings, you should always provide a handler type to `lamware()`. It will use this to ensure Middleware compatibility, as well as provide typings for the custom handler defined in `execute()`. For example:

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { lamware } from '@lamware/core';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>().execute(async ({ event, context }) => {
    // `event` and `context`, as well as the response type, are now properly typed for API Gateway.

    return { statusCode: 200 };
});

export { handler };
```

**Awesome** - that covers the basics of how to create your function using Lamware. Move on to Middleware to start taking advantage of this new format.
