<div align="center">
    <a href="https://www.npmjs.com/package/@tnotifier/lamware-do-not-wait" target="_blank">
        <img src="https://img.shields.io/npm/v/@tnotifier/lamware-do-not-wait?style=flat-square" alt="NPM" />
    </a>
    <a href="https://discord.gg/XMrHXtN" target="_blank">
        <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
    </a>
    <img src="https://img.shields.io/npm/l/@tnotifier/lamware-do-not-wait?style=flat-square" alt="Apache-2.0" />
    <h3>Lamware - Do Not Wait</h3>
</div>

This [Lamware](https://github.com/tnotifier/lamware) Middleware implements a Lambda best-practice of making sure Lambda doesn't wait for the event loop to be empty prior to responding by ensuring the `callbackWaitsForEmptyEventLoop` context variable is set to `false`.

## Installation

This package is available via NPM:

```bash
yarn add @tnotifier/lamware-do-not-wait

# or

npm install @tnotifier/lamware-do-not-wait
```

## Usage

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { doNotWait } from '@tnotifier/lamware-do-not-wait';
import { lamware } from '@tnotifier/lamware';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    .use(doNotWait())
    .execute(async () => {
        return { statusCode: 200 };
    });

export { handler };
```