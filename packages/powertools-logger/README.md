<div align="center">
  <a href="https://www.npmjs.com/package/@lamware/powertools-logger" target="_blank">
    <img src="https://img.shields.io/npm/v/@lamware/powertools-logger?style=flat-square" alt="NPM" />
  </a>
  <a href="https://discord.gg/3S6AKZ2GR9" target="_blank">
    <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
  </a>
  <img src="https://img.shields.io/npm/l/@lamware/powertools-logger?style=flat-square" alt="Apache-2.0" />
  <h3>Lamware - AWS Powertools Logger</h3>
</div>

This [Lamware](https://github.com/evilkiwi/lamware) Middleware utilizes the official [Lambda TypeScript Powertools](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/logger/) provided by AWS to:

- Set-up and memoize a root `Logger` instance
- Automatically add Lambda Context to all logging (can be disabled)
- Provide a logging interface to all further middleware & the handler itself

## Installation

This package is available via NPM:

```bash
yarn add @lamware/powertools-logger

# or

npm install @lamware/powertools-logger
```

## Usage

```typescript
import { powertoolsLogger } from '@lamware/powertools-logger';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { lamware } from '@lamware/core';

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
