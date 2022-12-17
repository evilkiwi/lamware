import type { Middleware } from '@lamware/core';

export const doNotWait = (): Middleware => ({
  id: 'do-not-wait',
  before: async (payload) => {
    payload.context.callbackWaitsForEmptyEventLoop = false;

    return payload;
  },
});
