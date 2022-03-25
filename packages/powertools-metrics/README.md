<div align="center">
    <a href="https://www.npmjs.com/package/@lamware/powertools-metrics" target="_blank">
        <img src="https://img.shields.io/npm/v/@lamware/powertools-metrics?style=flat-square" alt="NPM" />
    </a>
    <a href="https://discord.gg/XMrHXtN" target="_blank">
        <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
    </a>
    <img src="https://img.shields.io/npm/l/@lamware/powertools-metrics?style=flat-square" alt="Apache-2.0" />
    <h3>Lamware - AWS Powertools Metrics</h3>
</div>

This [Lamware](https://github.com/tnotifier/lamware) Middleware utilizes the official [Lambda TypeScript Powertools](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/metrics/) provided by AWS to:

- Set-up and memoize a root `Metrics` instance
- Publish Metrics automatically after the Function handler executes
- Optionally set-up default dimensions
- Automatically capture various metrics:
  - Cold starts
  - Function name

## Installation

This package is available via NPM:

```bash
yarn add @lamware/powertools-metrics

# or

npm install @lamware/powertools-metrics
```

## Usage

```typescript
import { powertoolsMetrics } from '@lamware/powertools-metrics';
import { MetricUnits } from '@aws-lambda-powertools/metrics';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { lamware } from '@lamware/core';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    .use(powertoolsMetrics({
        // Options are pass-through to the Tracing instance.
        namespace: 'tnotifier',
        serviceName: 'my-api',
    }))
    .execute(async ({ state }) => {
        state.metrics.addMetric('successfulBooking', MetricUnits.Count, 1);

        return { statusCode: 200 };
    });

export { handler };
```
