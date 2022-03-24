<div align="center">
    <a href="https://www.npmjs.com/package/@tnotifier/lamware-sqs-json-parser" target="_blank">
        <img src="https://img.shields.io/npm/v/@tnotifier/lamware-sqs-json-parser?style=flat-square" alt="NPM" />
    </a>
    <a href="https://discord.gg/XMrHXtN" target="_blank">
        <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
    </a>
    <img src="https://img.shields.io/npm/l/@tnotifier/lamware-sqs-json-parser?style=flat-square" alt="Apache-2.0" />
    <h3>Lamware - SQS JSON Parser</h3>
</div>

This [Lamware](https://github.com/tnotifier/lamware) Middleware allows you to automatically parse an SQS Queue payload and optionally provide TypeScript typings for the records.

## Installation

This package is available via NPM:

```bash
yarn add @tnotifier/lamware-sqs-json-parser

# or

npm install @tnotifier/lamware-sqs-json-parser
```

## Usage

```typescript
import { sqsJsonParser } from '@tnotifier/lamware-sqs-json-parser';
import type { SQSHandler } from 'aws-lambda';
import { lamware } from '@tnotifier/lamware';

interface MyRecord {
    title: string;
    content: string;
}

const { handler } = lamware<SQSHandler>()
    .use(sqsJsonParser<MyRecord>({
        // [optional] Whether to throw an error if the JSON fails to parse (default: true)
        throwOnError: false,
    }))
    .execute(async ({ state }) => {
        console.log(state.items); // MyRecord[]
    });

export { handler };
```
