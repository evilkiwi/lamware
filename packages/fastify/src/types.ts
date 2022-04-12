import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import type { DestructuredHandler } from '@lamware/core';

export interface Config extends FastifyServerOptions {
    /**
     * When using provisioned concurrency, enforcing ready state will
     * mean Fastify will get ready _before_ handling requests, so outside
     * of the handler. This has no real performance gain if not using
     * provisioned concurrency.
     *
     * See: https://github.com/fastify/aws-lambda-fastify/issues/89#issuecomment-1009721855
     */
    enforceReady?: boolean;

    /**
     * Optionally stop Lamware from attaching State to the Request objects.
     * Defaults to `true`.
     */
    attachState?: boolean;

    /**
     * Optionally provide a Fastify Client instead, otherwise one will
     * be created for you.
     */
    client?: FastifyInstance;
}

export interface State {
    fastify: FastifyInstance;
    fastifyHandler: DestructuredHandler;
}

export type SetupFunction = (app: State['fastify']) => Promise<State['fastify']>|State['fastify'];
