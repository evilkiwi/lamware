import type { TracerOptions } from '@aws-lambda-powertools/tracer/lib/types';
import type { Subsegment, Segment } from 'aws-xray-sdk-core';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { Middleware } from '@lamware/core';
import type { Handler } from 'aws-lambda';

export interface Options extends TracerOptions {
  /**
   * Whether to automatically attach responses to the tracer.
   * Default is `true`.
   */
  autoAttachResponse?: boolean;
}

export interface State {
  tracer: Tracer;
  segment: Subsegment|Segment;
  subsegment: Subsegment;
}

export const powertoolsTracing = (options: Options): Middleware<Handler, State> => ({
  id: 'powertools-tracing',
  init: async () => ({ tracer: new Tracer(options) }),
  before: async (payload) => {
    payload.state.segment = payload.state.tracer.getSegment();

    payload.state.subsegment = payload.state.segment.addNewSubsegment(`## ${process.env._HANDLER}`);
    payload.state.tracer.setSegment(payload.state.subsegment);

    payload.state.tracer.annotateColdStart();
    payload.state.tracer.addServiceNameAnnotation();

    return payload;
  },
  after: async (payload) => {
    if (options.autoAttachResponse !== false) {
      if (payload.response instanceof Error) {
        payload.state.tracer.addErrorAsMetadata(payload.response);
      } else {
        payload.state.tracer.addResponseAsMetadata(payload.response);
      }
    }

    payload.state.subsegment.close();
    payload.state.tracer.setSegment(payload.state.segment);

    return payload;
  },
});
