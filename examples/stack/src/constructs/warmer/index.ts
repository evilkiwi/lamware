import { Rule, Schedule, RuleTargetInput } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Aws, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import type { WarmerProps } from './types';

export class Warmer extends Construct {
  constructor(scope: Construct, id: string, props: WarmerProps) {
    super(scope, id);

    new Rule(this, 'warmerRule', {
      description: 'Executes a Lambda Function to keep it warm',
      // VPC-based Functions will die after 15 mins, non-VPC will be 5 mins
      schedule: Schedule.rate(Duration.minutes(10)),
      targets: [new LambdaFunction(props.function, {
        event: RuleTargetInput.fromObject({
          warmer: true,
          concurrency: props.concurrency,
        }),
      })],
    });

    props.function.addToRolePolicy(new PolicyStatement({
      resources: [`arn:aws:lambda:${Aws.REGION}:${Aws.ACCOUNT_ID}:function:*`],
      actions: ['lambda:InvokeFunction'],
      effect: Effect.ALLOW,
    }));
  }
}

export * from './types';
