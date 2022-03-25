<div align="center">
    <a href="https://www.npmjs.com/package/@lamware/secrets-manager" target="_blank">
        <img src="https://img.shields.io/npm/v/@lamware/secrets-manager?style=flat-square" alt="NPM" />
    </a>
    <a href="https://discord.gg/XMrHXtN" target="_blank">
        <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
    </a>
    <img src="https://img.shields.io/npm/l/@lamware/secrets-manager?style=flat-square" alt="Apache-2.0" />
    <h3>Lamware - AWS Secrets Manager</h3>
</div>

This [Lamware](https://github.com/tnotifier/lamware) Middleware utilizes the [AWS Secrets Manager SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/index.html) to fetch and memoize secrets from AWS Secrets Manager.

## Installation

This package is available via NPM:

```bash
yarn add @lamware/secrets-manager

# or

npm install @lamware/secrets-manager
```

## Usage

```typescript
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { secretsManager } from '@lamware/secrets-manager';
import { lamware } from '@lamware/core';

const { handler } = lamware<APIGatewayProxyHandlerV2<any>>()
    .use(secretsManager<{ secret1: string; secret2: Record<string, string> }>({
        region: 'us-east-2',
        secrets: {
            // You can provide a Secret Name
            secret1: 'my-secret-123',
            // Or a Secret ARN
            secret2: 'arn:aws:secretsmanager:us-east-2:590000000000:secret:my-secret-123',
        },
    }))
    .execute(async ({ state }) => {
        const { secret1, secret2 } = state.secrets;

        console.log(secret1, secret2);

        return { statusCode: 200 };
    });

export { handler };
```
