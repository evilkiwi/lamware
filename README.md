<div align="center">
    <a href="https://www.npmjs.com/package/@lamware/core" target="_blank">
        <img src="https://img.shields.io/npm/v/@lamware/core?style=flat-square" alt="NPM" />
    </a>
    <a href="https://discord.gg/XMrHXtN" target="_blank">
        <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
    </a>
    <img src="https://img.shields.io/npm/l/@lamware/core?style=flat-square" alt="Apache-2.0" />
    <h3>AWS Lambda Middleware Pattern (NodeJS)</h3>
</div>

[Lamware](https://github.com/tnotifier/lamware) is a simple design pattern based on middleware for AWS Lambda. Lambda, like other Cloud Function platforms, is executed by a request - which could be from anything like a queue (SQS) to a HTTP request. Since Lambda focusses on business logic, setting things up before-hand can be quite tedious.

Using a middleware pattern means your function is slightly delayed in recieving the event whilst Lamware runs various logic to set things up (in parallel, where possible). For example, you could have middleware set up to do things like:

- Pull Secrets from Secrets Manager/external service
- Fetch JSON config from AppConfig
- Exit early if this was a Warming event from CloudWatch
- Automate some Tracing bootstrap
- Set-up some best practises (Like `callbackWaitsForEmptyEventLoop`)

## Installation

This package is available via NPM:

```bash
yarn add @lamware/core

# or

npm install @lamware/core
```

We maintain and ship various middlewares for public use - you can [install them too!](https://github.com/tnotifier/lamware/tree/master/packages)

## Usage

We have [Documentation available here](https://github.com/tnotifier/lamware), and you can check out the [`example` folder](https://github.com/tnotifier/lamware/tree/master/example) for a fully-featured example with the AWS CDK stack to deploy it.

```typescript
import { powertoolsTracing } from '@lamware/powertools-tracing';
import { powertoolsLogger } from '@lamware/powertools-logger';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { doNotWait } from '@lamware/do-not-wait';
import { appconfig } from '@lamware/appconfig';
import { sentry } from '@lamware/sentry';
import { warmer } from '@lamware/warmer';
import { lamware } from '@lamware/core';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    .use(doNotWait())
    .use(powertoolsTracing({
        serviceName: 'lamware-example',
    }))
    .use(powertoolsLogger({
        serviceName: 'lamware-example',
        logLevel: 'DEBUG',
    }))
    .use(appconfig<{ hello: string }>({
        app: 'tnotifier-lamware-example',
        env: 'production',
        config: 'production',
    }))
    .use(sentry({
        config: {
            dsn: 'https://d99b0b438475869385706e70157c5e05@o1080839.ingest.sentry.io/6270000',
        },
    }))
    .use(warmer())
    .execute(async ({ state }) => {
        return {
            statusCode: 200,
            body: JSON.stringify({
                hello: 'world',
                appconfig: state.config,
            }),
        };
    });

export { handler };
```
