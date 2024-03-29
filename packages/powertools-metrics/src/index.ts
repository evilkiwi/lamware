import type { MetricsOptions } from '@aws-lambda-powertools/metrics/lib/types';
import { Metrics } from '@aws-lambda-powertools/metrics';
import type { Middleware } from '@lamware/core';
import type { Handler } from 'aws-lambda';

export interface Options extends MetricsOptions {
  captureColdStartMetric?: boolean;
  captureFunctionName?: boolean;
  throwOnEmptyMetrics?: boolean;
}

export const powertoolsMetrics = (options: Options): Middleware<Handler, { metrics: Metrics }> => ({
  id: 'powertools-metrics',
  init: async () => ({ metrics: new Metrics(options) }),
  before: async (payload) => {
    if (options.captureFunctionName !== false) {
      payload.state.metrics.setFunctionName(payload.context.functionName);
    }

    const { throwOnEmptyMetrics, defaultDimensions, captureColdStartMetric } = options;

    if (throwOnEmptyMetrics !== false) {
      payload.state.metrics.throwOnEmptyMetrics();
    }

    if (defaultDimensions !== undefined) {
      payload.state.metrics.setDefaultDimensions(defaultDimensions);
    }

    if (captureColdStartMetric !== false) {
      payload.state.metrics.captureColdStartMetric();
    }

    return payload;
  },
  after: async (payload) => {
    payload.state.metrics.publishStoredMetrics();

    return payload;
  },
});
