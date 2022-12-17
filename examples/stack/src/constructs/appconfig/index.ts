import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import type { ILayerVersion } from 'aws-cdk-lib/aws-lambda';
import { LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { Aws } from 'aws-cdk-lib';

export class AppConfig extends Construct {
  policy: PolicyStatement;
  layer: ILayerVersion;
  env = {
    AWS_APPCONFIG_EXTENSION_POLL_INTERVAL_SECONDS: '30',
    AWS_APPCONFIG_EXTENSION_POLL_TIMEOUT_MILLIS: '3000',
    AWS_APPCONFIG_EXTENSION_HTTP_PORT: '2772',
  };

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.policy = new PolicyStatement({
      resources: [`arn:aws:appconfig:${Aws.REGION}:${Aws.ACCOUNT_ID}:application/*`],
      actions: ['appconfig:GetConfiguration'],
      effect: Effect.ALLOW,
    });

    this.layer = LayerVersion.fromLayerVersionArn(this, 'appconfigLayerVersion', 'arn:aws:lambda:us-east-2:728743619870:layer:AWS-AppConfig-Extension:15');
  }
}
