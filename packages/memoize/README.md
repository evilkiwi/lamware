<div align="center">
    <a href="https://www.npmjs.com/package/@tnotifier/lamware-memoize" target="_blank">
        <img src="https://img.shields.io/npm/v/@tnotifier/lamware-memoize?style=flat-square" alt="NPM" />
    </a>
    <a href="https://discord.gg/XMrHXtN" target="_blank">
        <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
    </a>
    <img src="https://img.shields.io/npm/l/@tnotifier/lamware-memoize?style=flat-square" alt="Apache-2.0" />
    <h3>Lamware - Variable Memoize</h3>
</div>

This [Lamware](https://github.com/tnotifier/lamware) Middleware allows you to memoize variables and instances outside of the Lambda Handler with ease.

## Why?

A lesser known feature of Lambda is that variables declared outside of the handler persist through the handler lifecycle. Since a Lambda instance, once cold-started, stays alive for 5-15 minutes (varies based on activity and the type of Lambda function), this provides a clear performance gain over having all logic instantiated inside the handler itself, since it'll only execute once (on the first request/invocation).

Currently, Lambda doesn't support top-level `async/await`, meaning set-up that involves non-synchronous operations isn't as simple as placing it outside the handler. By allowing you to supply a closure, and Lamware having support for asynchronous initialization, this middleware allows you to asynchronously memoize/load outside of the handler.

## Installation

This package is available via NPM:

```bash
yarn add @tnotifier/lamware-memoize

# or

npm install @tnotifier/lamware-memoize
```

## Usage

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { memoize } from '@tnotifier/lamware-memoize';
import { lamware } from '@tnotifier/lamware';

interface MemoizePayload {
    count: number;
}

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    .use(memoize<MemoizePayload>(async () => {
        return { count: 1 };
    }, {
        // [optional] Whether to throw an `Error` if the memoize closure fails [default: true]
        throwOnError: false,
    }))
    .execute(async ({ state }) => {
        return {
            statusCode: 200,
            message: 'count should always be `1` since it is memoized!',
            count: state.count,
        };
    });

export { handler };
```
