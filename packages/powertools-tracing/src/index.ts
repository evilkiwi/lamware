import type { TracerOptions } from '@aws-lambda-powertools/tracer/lib/types';
import type { Subsegment, Segment } from 'aws-xray-sdk-core';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { Middleware } from '@tnotifier/lamware';
import type { Handler } from 'aws-lambda';

export const powertoolsTracing = (options: TracerOptions): Middleware<Handler, {
    tracer: Tracer;
    segment: Subsegment|Segment;
    subsegment: Subsegment;
}> => {
    return {
        id: 'powertools-tracing',
        pure: true,
        init: async () => {
            return { tracer: new Tracer(options) };
        },
        before: async (payload) => {
            payload.state.segment = payload.state.tracer.getSegment();

            payload.state.subsegment = payload.state.segment.addNewSubsegment(`## ${process.env._HANDLER}`);
            payload.state.tracer.setSegment(payload.state.subsegment);

            payload.state.tracer.annotateColdStart();
            payload.state.tracer.addServiceNameAnnotation();

            return payload;
        },
        after: async (payload) => {
            if (payload.response instanceof Error) {
                payload.state.tracer.addErrorAsMetadata(payload.response);
            }

            payload.state.subsegment.close();
            payload.state.tracer.setSegment(payload.state.segment);

            return payload;
        },
    };
};
