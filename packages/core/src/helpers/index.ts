import type { Handler } from 'aws-lambda';
import type { DestructuredHandler } from '@/instance';

/**
 * Wraps a Lamware-compatible Handler with a stock AWS Lambda handler.
 */
export const wrapCompat = (handler: DestructuredHandler, create: (compatHandler: Handler) => Handler): DestructuredHandler => {
  return payload => {
    const compatHandler = create((event, context, callback) => {
      return handler({ ...payload, event, context, callback });
    });

    return compatHandler(payload.event, payload.context, payload.callback);
  };
};
