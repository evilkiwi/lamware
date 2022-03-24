import type { Handler } from 'aws-lambda';
import type { DestructuredHandler } from '@/instance';

export const wrapCompat = (handler: DestructuredHandler, create: (compatHandler: Handler) => Handler): DestructuredHandler => {
    return payload => {
        const compatHandler = create((event, context, callback) => handler({ ...payload, event, context, callback }));
        return compatHandler(payload.event, payload.context, payload.callback);
    };
};
