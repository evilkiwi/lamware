import type { Middleware } from '@tnotifier/lamware';
import type { SQSHandler } from 'aws-lambda';

export interface Options {
    throwOnError?: boolean;
}

export const sqsJsonParser = <R extends object>(options?: Options): Middleware<SQSHandler, { items: R[] }> => ({
    id: 'sqs-json-parser',
    pure: true,
    before: async (payload) => {
        try {
            payload.state.items = payload.event.Records.map<R>(record => {
                return JSON.parse(record.body);
            });
        } catch (e) {
            if (options?.throwOnError !== false) {
                throw new Error(`failed to process record json: ${e}`);
            }
        }

        return payload;
    },
});
