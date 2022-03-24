<div align="center">
    <a href="https://www.npmjs.com/package/@tnotifier/lamware-sentry" target="_blank">
        <img src="https://img.shields.io/npm/v/@tnotifier/lamware-sentry?style=flat-square" alt="NPM" />
    </a>
    <a href="https://discord.gg/XMrHXtN" target="_blank">
        <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
    </a>
    <img src="https://img.shields.io/npm/l/@tnotifier/lamware-sentry?style=flat-square" alt="Apache-2.0" />
    <h3>Lamware - Sentry</h3>
</div>

This [Lamware](https://github.com/tnotifier/lamware) Middleware utilizes the [Sentry Serverless SDK](https://docs.sentry.io/platforms/node/guides/aws-lambda/) to automatically initialize and wrap your Lambda Function handler to capture errors and report them to Sentry.

## Installation

This package is available via NPM:

```bash
yarn add @tnotifier/lamware-sentry

# or

npm install @tnotifier/lamware-sentry
```

## Usage

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { sentry } from '@tnotifier/lamware-sentry';
import { lamware } from '@tnotifier/lamware';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    .use(sentry({
        // You can provide config directly to the SDK `init()`.
        config: {
            dsn: 'your-sentry-dsn-here',
        },
        // You can also optionally provide options to the wrapper.
        wrapper: {
            callbackWaitsForEmptyEventLoop: false,
        },
    }))
    .execute(async () => {
        return { statusCode: 200 };
    });

export { handler };
```
