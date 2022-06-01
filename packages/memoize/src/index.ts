import type { Middleware } from '@lamware/core';
import type { Handler } from 'aws-lambda';

export interface Options {
    throwOnError?: boolean;
}

export const memoize = <S extends object>(closure: (getState: () => S) => Promise<Partial<S>|void>, options?: Options): Middleware<Handler, S> => ({
    id: 'memoize',
    init: async (getState) => {
        try {
            return await closure(getState);
        } catch (e) {
            if (options?.throwOnError !== false) {
                throw new Error(`failed to memoize: ${e}`);
            }
        }
    },
});
