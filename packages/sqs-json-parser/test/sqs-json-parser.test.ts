import { lamware, clearMiddleware } from '@lamware/core';
import { afterEach, expect, test } from 'vitest';
import type { SQSHandler } from 'aws-lambda';
import { execute } from '@lamware/test';
import { sqsJsonParser } from '../src';

afterEach(() => clearMiddleware());

interface DebugRecord {
    title: string;
    enabled: boolean;
}

const items: DebugRecord[] = [{
    title: 'Debug 1',
    enabled: true,
}, {
    title: 'Debug 2',
    enabled: false,
}, {
    title: 'Debug 3',
    enabled: true,
}];

test('should parse json records from event', async () => {
    let parsedItems: any = {};

    const { handler } = lamware<SQSHandler>()
        .use(sqsJsonParser<DebugRecord>())
        .execute(async ({ state }) => {
            parsedItems = state.items;
        });
    await execute(handler, 'sqs', { items });

    expect(parsedItems).toStrictEqual(items);
});
