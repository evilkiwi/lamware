import { CorsHttpMethod, HttpApi, HttpMethod, DomainName } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { LambdaInsightsVersion, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import { ApiGatewayv2DomainProperties } from 'aws-cdk-lib/aws-route53-targets';
import { DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { Port, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Aws, Duration, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';
import { AppConfig, LambdaFunction, Warmer } from '../../constructs';
import { hash, importXrayPolicy } from '../../helpers';
import type { StackProps } from './types';

export class LamwareStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        // Fetch some base resources.
        const xray = importXrayPolicy();

        // Fetch the VPC.
        const vpc = Vpc.fromLookup(this, 'vpc', {
            vpcId: 'vpc-034a477d9d931104a',
        });

        // Create the Security Group.
        const securityGroup = new SecurityGroup(this, 'securityGroup', {
            vpc,
            description: 'Generic all-purpose internal group',
            allowAllOutbound: true,
        });
        securityGroup.addIngressRule(securityGroup, Port.allTraffic(), 'Allow all inbound in the same SG');

        // Fetch an AppConfig Layer.
        const appConfig = new AppConfig(this, 'appconfigLayer');

        // Fetch the DNS Zone.
        const zone = HostedZone.fromLookup(this, 'dnsZone', {
            domainName: 'tnotifier.app',
        });

        // Ensure there is a Certificate and fetch the ARN.
        const certificate = new DnsValidatedCertificate(this, 'sslCertificate', {
            domainName: 'lamware-example.tnotifier.app',
            hostedZone: zone,
            region: Aws.REGION,
        });

        // Create the API Gateway Domain Mapping.
        const domainName = new DomainName(this, 'apigDomain', {
            domainName: 'lamware-example.tnotifier.app',
            certificate,
        });

        // Create the API Gateway.
        const api = new HttpApi(this, 'apigIngress', {
            createDefaultStage: true,
            description: 'HTTP Ingress for API',
            defaultDomainMapping: { domainName },
            corsPreflight: {
                allowMethods: [CorsHttpMethod.ANY],
                allowOrigins: ['*'],
                allowHeaders: ['*'],
                allowCredentials: false,
                maxAge: Duration.hours(1),
            },
        });

        // Create the HTTP Ingress Function.
        const func = new LambdaFunction(this, 'apigHandler', {
            root: props.root,
            vpc,
            securityGroups: [securityGroup],
            projectRoot: join(props.root, 'function'),
            memorySize: 512,
            description: 'Generic API Handler',
            insightsVersion: LambdaInsightsVersion.VERSION_1_0_119_0,
            timeout: Duration.seconds(30),
            runtime: Runtime.NODEJS_14_X,
            tracing: Tracing.ACTIVE,
            layers: [appConfig.layer],
            handler: 'src/index.handler',
            hash: hash({
                name: 'example',
                path: join(props.root, 'function'),
                folders: ['src'],
                files: ['package.json'],
            }),
            environment: {
                ...appConfig.env,
                NODE_OPTIONS: '--enable-source-maps',
            },
        });
        func.addToRolePolicy(appConfig.policy);
        func.addToRolePolicy(xray);

        const integration = new HttpLambdaIntegration('lambdaIntegration', func);

        api.addRoutes({
            path: '/{proxy+}',
            methods: [HttpMethod.GET, HttpMethod.POST],
            integration,
        });

        // Create the Warmer.
        new Warmer(this, 'warmer', {
            concurrency: 5,
            function: func,
        });

        // Create a DNS Record for the CloudFront Ingress.
        new ARecord(this, 'dnsRecord', {
            recordName: 'lamware-example.tnotifier.app',
            target: RecordTarget.fromAlias(
                new ApiGatewayv2DomainProperties(domainName.regionalDomainName, domainName.regionalHostedZoneId),
            ),
            zone,
        });
    }
}
