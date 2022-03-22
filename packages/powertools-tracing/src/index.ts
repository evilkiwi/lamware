import type { TracerOptions } from '@aws-lambda-powertools/tracer/lib/types';
import type { Subsegment, Segment } from 'aws-xray-sdk-core';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { Middleware } from '@tnotifier/lamware';

declare module 'aws-lambda' {
    interface Context {
        tracer: Tracer;
        segment: Subsegment|Segment;
        subsegment: Subsegment;
    }
}

export const powertoolsTracing = (options: TracerOptions): Middleware => {
    const tracer = new Tracer(options);
    let segment!: Subsegment|Segment;
    let subsegment!: Subsegment;

    return {
        id: 'powertools-tracing',
        pure: true,
        before: async (payload) => {
            segment = tracer.getSegment();

            subsegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
            tracer.setSegment(subsegment);

            tracer.annotateColdStart();
            tracer.addServiceNameAnnotation();

            payload.context.tracer = tracer;
            payload.context.segment = segment;
            payload.context.subsegment = subsegment;

            return payload;
        },
        after: async (payload) => {
            if (payload.response instanceof Error) {
                tracer.addErrorAsMetadata(payload.response);
            }

            subsegment.close();
            tracer.setSegment(segment);

            return payload;
        },
    };
};
