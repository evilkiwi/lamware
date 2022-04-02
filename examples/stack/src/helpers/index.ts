import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export const importXrayPolicy = () => {
    return new PolicyStatement({
        resources: ['*'],
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        effect: Effect.ALLOW,
    });
};

export * from './hash';
