import { sqsJsonParser } from '@lamware/sqs-json-parser';
import { doNotWait } from '@lamware/do-not-wait';
import type { SQSHandler } from 'aws-lambda';
import { lamware } from '@lamware/core';

interface Record {
    title: string;
    enabled: boolean;
}

const { handler } = lamware<SQSHandler>()
    .use(doNotWait())
    .use(sqsJsonParser<Record>())
    .execute(async ({ state }) => {
        await state.items.reduce(async (promise, item) => {
            await promise;

            // TODO: Do something with the now-typed `item`
        }, Promise.resolve());
    });

export { handler };
