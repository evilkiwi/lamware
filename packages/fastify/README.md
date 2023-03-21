<div align="center">
  <a href="https://www.npmjs.com/package/@lamware/fastify" target="_blank">
    <img src="https://img.shields.io/npm/v/@lamware/fastify?style=flat-square" alt="NPM" />
  </a>
  <a href="https://discord.gg/3S6AKZ2GR9" target="_blank">
    <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
  </a>
  <img src="https://img.shields.io/npm/l/@lamware/fastify?style=flat-square" alt="Apache-2.0" />
  <h3>Lamware - Fastify</h3>
</div>

This [Lamware](https://github.com/evilkiwi/lamware) Middleware utilizes the [official AWS Lambda Fastify Client](https://github.com/fastify/aws-lambda-fastify) to provide a convenient, and performant, method of intializing and memoizing Fastify in AWS Lambda:

- Enforces memoization of Fastify Client outside of function handler
- Allow for top-level ready state initialization, perfect for Provisioned Concurrency

## Installation

This package is available via NPM:

```bash
yarn add @lamware/fastify

# or

npm install @lamware/fastify
```

## Usage

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { LamwareState } from '@lamware/core';
import { fastify } from '@lamware/fastify';
import { lamware } from '@lamware/core';
// import createFastify from 'fastify';

const { instance, handler } = lamware<APIGatewayProxyHandlerV2<any>>()
  .use(fastify(app => {
    // You can provide a closure that exposes the `fastify` instance.
    app.get('/', (request, reply) => {
      reply.send({ hello: 'world' }));
    };

    return app;
  }, {
    // You can optionally provide an existing Fastify client.
    // client: createFastify(),

    // And also enforce Fastify to ready-up before running.
    enforceReady: true,
  }))
  .execute(async (payload) => {
    return payload.state.fastifyHandler(payload);
  });

/**
 * Fastify doesn't have _great_ flexibility when it comes to typing.
 * As a result, you'll have to manually type the state request object.
 * For example:
 */

declare module 'fastify' {
  interface FastifyRequest {
    state: LamwareState<typeof instance>;
  }
}

export { handler };
```
