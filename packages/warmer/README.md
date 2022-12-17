<div align="center">
  <a href="https://www.npmjs.com/package/@lamware/warmer" target="_blank">
    <img src="https://img.shields.io/npm/v/@lamware/warmer?style=flat-square" alt="NPM" />
  </a>
  <a href="https://discord.gg/XMrHXtN" target="_blank">
    <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
  </a>
  <img src="https://img.shields.io/npm/l/@lamware/warmer?style=flat-square" alt="Apache-2.0" />
  <h3>Lamware - Warmer</h3>
</div>

This [Lamware](https://github.com/evilkiwi/lamware) Middleware utilizes the [`lambda-warmer`](https://github.com/jeremydaly/lambda-warmer) package, automating usage of it by providing:

- Automatically registering the warming listener
- Early-exit out of your Function if it detects a warming event

## Installation

This package is available via NPM:

```bash
yarn add @lamware/warmer

# or

npm install @lamware/warmer
```

## Usage

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { warmer } from '@lamware/warmer';
import { lamware } from '@lamware/core';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
  .use(warmer())
  .execute(async () => {
    return { statusCode: 200 };
  });

export { handler };
```
