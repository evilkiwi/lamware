<div align="center">
  <a href="https://www.npmjs.com/package/@lamware/sst" target="_blank">
    <img src="https://img.shields.io/npm/v/@lamware/sst?style=flat-square" alt="NPM" />
  </a>
  <a href="https://discord.gg/3S6AKZ2GR9" target="_blank">
    <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
  </a>
  <img src="https://img.shields.io/npm/l/@lamware/sst?style=flat-square" alt="Apache-2.0" />
  <h3>Lamware - SST</h3>
</div>

This [Lamware](https://github.com/evilkiwi/lamware) Middleware wraps your Lambda Function using the SST API Handler, allowing the SST runtime hooks to work with their dependency injection.

## Installation

This package is available via NPM:

```bash
yarn add @lamware/sst

# or

npm install @lamware/sst
```

## Usage

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { useJsonBody } from 'sst/node/api';
import { lamware } from '@lamware/core';
import { sst } from '@lamware/sst';

const { handler } = lamware<APIGatewayProxyHandlerV2>()
  .use(sst())
  .execute(async () => {
    const json = useJsonBody();

    return { statusCode: 200 };
  });

export { handler };
```
