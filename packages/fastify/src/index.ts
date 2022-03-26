import type { DestructuredHandler, Middleware } from '@lamware/core';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { FastifyInstance } from 'fastify';
import lambdaFastify from 'aws-lambda-fastify';
import { state } from '@lamware/core';
import createFastify from 'fastify';

export interface Config {
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
     * Whether Lamware should attach its state to each request.
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

declare module 'fastify' {
    interface FastifyRequest {
        state: unknown; // TODO: Fastify really needs better typing support...
    }
}

export const fastify = (setup?: SetupFunction, config?: Config): Middleware<APIGatewayProxyHandlerV2<any>, State> => ({
    id: 'fastify',
    pure: true,
    init: async () => {
        let app = config?.client ?? createFastify();

        if (setup) {
            app = await setup(app);
        }

        app.addHook('onRequest', async (request) => {
            request.state = config?.attachState !== false ? state() : {};
        });

        const handler = lambdaFastify(app);

        if (config?.enforceReady === true) {
            await app.ready();
        }

        return {
            fastify: app,
            fastifyHandler: async ({ event, context }) => handler(event, context),
        };
    },
});
