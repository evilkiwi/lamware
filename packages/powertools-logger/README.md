<div align="center">
    <a href="https://www.npmjs.com/package/@tnotifier/lamware-powertools-logger" target="_blank">
        <img src="https://img.shields.io/npm/v/@tnotifier/lamware-powertools-logger?style=flat-square" alt="NPM" />
    </a>
    <a href="https://discord.gg/XMrHXtN" target="_blank">
        <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
    </a>
    <img src="https://img.shields.io/npm/l/@tnotifier/lamware-powertools-logger?style=flat-square" alt="Apache-2.0" />
    <h3>Lamware - AWS Powertools Logger</h3>
</div>

This [Lamware](https://github.com/tnotifier/lamware) Middleware utilizes the official [Lambda TypeScript Powertools](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/logger/) provided by AWS to:

- Set-up and memoize a root `Logger` instance
- Automatically add Lambda Context to all logging (can be disabled)
- Provide a logging interface to all further middleware & the handler itself

## Installation

This package is available via NPM:

```bash
yarn add @tnotifier/lamware-powertools-logger

# or

npm install @tnotifier/lamware-powertools-logger
```

## Usage

```typescript
import { powertoolsLogger } from '@tnotifier/lamware-powertools-logger';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { lamware } from '@tnotifier/lamware';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    .use(powertoolsLogger({
        // Options are pass-through to the Logger instance.
        serviceName: 'my-api',
    }))
    .execute(async ({ state, logger }) => {
        logger.debug('Hello world!');

        return { statusCode: 200 };
    });

export { handler };
```
