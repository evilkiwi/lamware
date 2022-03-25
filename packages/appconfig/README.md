<div align="center">
    <a href="https://www.npmjs.com/package/@lamware/appconfig" target="_blank">
        <img src="https://img.shields.io/npm/v/@lamware/appconfig?style=flat-square" alt="NPM" />
    </a>
    <a href="https://discord.gg/XMrHXtN" target="_blank">
        <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
    </a>
    <img src="https://img.shields.io/npm/l/@lamware/appconfig?style=flat-square" alt="Apache-2.0" />
    <h3>Lamware - AWS AppConfig</h3>
</div>

This [Lamware](https://github.com/tnotifier/lamware) Middleware utilizes an API exposed by the [AWS Lambda AppConfig Layer Extension](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions.html) to pull-down a copy of an AppConfig configuration and allows you to easily provide TypeScript typings for it.

## Installation

This package is available via NPM:

```bash
yarn add @lamware/appconfig

# or

npm install @lamware/appconfig
```

## Usage

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { appconfig } from '@lamware/appconfig';
import { lamware } from '@lamware/core';

interface AppConfig {
    helloWorld: string;
}

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    /**
     * You can provide an Interface to the middleware to automatically type
     * the config in the handler `execute`.
     **/
    .use(appconfig<AppConfig>({
        // Ensure you provide the info required to pull down a configuration.
        app: 'tnotifier-api',
        env: 'production',
        config: 'production',
        // You can also optionally provide an override URL for the AppConfig API.
        url: 'http://localhost:2772', // The default, provided by the AppConfig Lambda Extension.
    }))
    .execute(async ({ state }) => {
        return {
            statusCode: 200,
            body: JSON.stringify({
                debug: state.config.helloWorld,
            }),
        };
    });

export { handler };
```
