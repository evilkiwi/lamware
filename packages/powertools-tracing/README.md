<div align="center">
    <a href="https://www.npmjs.com/package/@tnotifier/lamware-powertools-tracing" target="_blank">
        <img src="https://img.shields.io/npm/v/@tnotifier/lamware-powertools-tracing?style=flat-square" alt="NPM" />
    </a>
    <a href="https://discord.gg/XMrHXtN" target="_blank">
        <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
    </a>
    <img src="https://img.shields.io/npm/l/@tnotifier/lamware-powertools-tracing?style=flat-square" alt="Apache-2.0" />
    <h3>Lamware - AWS Powertools Tracing</h3>
</div>

This [Lamware](https://github.com/tnotifier/lamware) Middleware utilizes the official [Lambda TypeScript Powertools](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/tracer/) provided by AWS to:

- Set-up and memoize a root `Tracer` instance
- Automatically set-up a root Tracer Segment to:
  - Annotate the cold-start time
  - Set the service name
  - If the response is an error, capture that too
  - Clean-up and close segments created by the package

## Installation

This package is available via NPM:

```bash
yarn add @tnotifier/lamware-powertools-tracing

# or

npm install @tnotifier/lamware-powertools-tracing
```

## Usage

```typescript
import { powertoolsTracing } from '@tnotifier/lamware-powertools-tracing';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { lamware } from '@tnotifier/lamware';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    .use(powertoolsTracing({
        // Options are pass-through to the Tracing instance.
        serviceName: 'my-api',
    }))
    .execute(async ({ state }) => {
        // state.tracer
        // state.segment
        // state.subsegment

        return { statusCode: 200 };
    });

export { handler };
```
