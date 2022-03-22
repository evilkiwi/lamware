<div align="center">
    <a href="https://www.npmjs.com/package/@tnotifier/lamware" target="_blank">
        <img src="https://img.shields.io/npm/v/@tnotifier/lamware?style=flat-square" alt="NPM" />
    </a>
    <a href="https://discord.gg/XMrHXtN" target="_blank">
        <img src="https://img.shields.io/discord/123906549860139008?color=7289DA&label=discord&logo=discord&logoColor=FFFFFF&style=flat-square" alt="Discord" />
    </a>
    <img src="https://img.shields.io/npm/l/@tnotifier/lamware?style=flat-square" alt="Apache-2.0" />
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
yarn add @tnotifier/lamware

# or

npm install @tnotifier/lamware
```

We maintain and ship various middlewares for public use - you can [install them too!](#TODO:)

## Usage

You can check out the [`example` folder](#TODO:) for a fully-featured example.
