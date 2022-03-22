import type { Handler } from 'aws-lambda';
import type { DestructuredHandler } from '@/instance';

export const wrapCompat = (handler: DestructuredHandler): Handler => {
    return (event, context, callback) => handler({ event, context, callback, state: {} });
};

export const unwrapCompat = (handler: Handler): DestructuredHandler => {
    return ({ event, context, callback }) => handler(event, context, callback);
};
