import type { Middleware } from '@tnotifier/lamware';

export const doNotWait = (): Middleware => ({
    id: 'do-not-wait',
    pure: true,
    before: async (payload) => {
        payload.context.callbackWaitsForEmptyEventLoop = false;

        return payload;
    },
});
