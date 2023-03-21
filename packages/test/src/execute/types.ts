import type { Handler } from 'aws-lambda';

export type EventType = 'sqs'|'apiGateway'|'apiGatewayV2';

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
