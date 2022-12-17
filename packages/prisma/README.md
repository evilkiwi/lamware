<div align="center">
  <a href="https://www.npmjs.com/package/@lamware/prisma" target="_blank">
    <img src="https://img.shields.io/npm/v/@lamware/prisma?style=flat-square" alt="NPM" />
  </a>
  <a href="https://discord.gg/XMrHXtN" target="_blank">
    <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
  </a>
  <img src="https://img.shields.io/npm/l/@lamware/prisma?style=flat-square" alt="Apache-2.0" />
  <h3>Lamware - Prisma ORM</h3>
</div>

This [Lamware](https://github.com/evilkiwi/lamware) Middleware allows you to initialize and memoize your [Prisma](https://prisma.io) Client.

## Installation

This package is available via NPM:

```bash
yarn add @lamware/prisma

# or

npm install @lamware/prisma
```

## Usage

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { prisma } from '@lamware/prisma';
import { lamware } from '@lamware/core';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
  // You can provide your PrismaClient directly.
  .use(prisma(PrismaClient))

  // Or an (a)synchronous set-up closure.
  .use(prisma(async () => {
    return new PrismaClient();
  }))

  .execute(async ({ state }) => {
    const user = await state.prisma.user.findUnique({
      where: { id: 1 },
    });

    return { statusCode: 200 };
  });

export { handler };
```
