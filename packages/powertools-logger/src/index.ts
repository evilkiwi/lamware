import type { ConstructorOptions as LoggerOptions } from '@aws-lambda-powertools/logger/lib/types';
import type { Middleware, Logger as LamwareLogger } from '@lamware/core';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Handler } from 'aws-lambda';

export interface Options extends LoggerOptions {
  /**
   * Whether to automatically attach the Lambda context
   * to logging events.
   */
  addContext?: boolean;
}

export const powertoolsLogger = (options?: Options): Middleware<Handler, { logger: Logger }> => ({
  id: 'powertools-logger',
  init: async () => ({ logger: new Logger(options) }),
  logger: ({ logger }) => (logger as unknown) as LamwareLogger,
  before: async (payload) => {
    if (options?.addContext !== false) {
      payload.state.logger.addContext(payload.context);
    }

    return payload;
  },
});
