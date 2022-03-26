import type { Handler } from 'aws-lambda';
import type * as events from '@/../../../build/events';

export type EventType = keyof typeof events;

export interface Options<H extends Handler, E extends EventType> {
    handler: H;
    event: E;
}

export interface EventOptions {
    apiGateway: ApiGatewayOptions;
    apiGatewayV2: ApiGatewayOptions;
    sqs: SqsOptions;
}

export interface BaseOptions {
    override?: any;
}

export interface SqsOptions extends BaseOptions {
    items?: any[];
}

export interface ApiGatewayOptions extends BaseOptions {
    path?: string;
    headers?: Record<string, string>;
    method?: string;
    query?: Record<string, string>;
    body?: any;
}
