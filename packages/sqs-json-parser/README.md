<div align="center">
  <a href="https://www.npmjs.com/package/@lamware/sqs-json-parser" target="_blank">
    <img src="https://img.shields.io/npm/v/@lamware/sqs-json-parser?style=flat-square" alt="NPM" />
  </a>
  <a href="https://discord.gg/3S6AKZ2GR9" target="_blank">
    <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
  </a>
  <img src="https://img.shields.io/npm/l/@lamware/sqs-json-parser?style=flat-square" alt="Apache-2.0" />
  <h3>Lamware - SQS JSON Parser</h3>
</div>

This [Lamware](https://github.com/evilkiwi/lamware) Middleware allows you to automatically parse an SQS Queue payload and optionally provide TypeScript typings for the records.

## Installation

This package is available via NPM:

```bash
yarn add @lamware/sqs-json-parser

# or

npm install @lamware/sqs-json-parser
```

## Usage

```typescript
import { sqsJsonParser } from '@lamware/sqs-json-parser';
import type { SQSHandler } from 'aws-lambda';
import { lamware } from '@lamware/core';

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
