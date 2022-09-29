<div align="center">
    <a href="https://www.npmjs.com/package/@lamware/apollo" target="_blank">
        <img src="https://img.shields.io/npm/v/@lamware/apollo?style=flat-square" alt="NPM" />
    </a>
    <a href="https://discord.gg/XMrHXtN" target="_blank">
        <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
    </a>
    <img src="https://img.shields.io/npm/l/@lamware/apollo?style=flat-square" alt="Apache-2.0" />
    <h3>Lamware - Apollo Server</h3>
</div>

This [Lamware](https://github.com/oyed/lamware) Middleware utilizes the official [`apollo-server-lambda`](https://www.npmjs.com/package/apollo-server-lambda) package to set-up your Apollo Server outside of the main handler, improving performance.

## Installation

This package is available via NPM:

```bash
yarn add @lamware/apollo

# or

npm install @lamware/apollo
```

## Usage

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ApolloServer } from 'apollo-server-lambda';
import { apollo } from '@lamware/apollo';
import { lamware } from '@lamware/core';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    // You can pass regular Apollo options.
    .use(apollo({
        introspection: false,
        debug: false,
        schema: ...,
    }))
    // You can also pass an entire Apollo Server instance.
    .use(apollo(new ApolloServer({
        introspection: false,
        debug: false,
        schema: ...,
    })))
    // Or even an (a)synchronous closure!
    .use(apollo(async () => {
        return new ApolloServer({
            introspection: false,
            debug: false,
            schema: ...,
        });
    }))
    .execute(async (payload) => {
        return payload.state.apolloHandler(payload);
    });

export { handler };
```
