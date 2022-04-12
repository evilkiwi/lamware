import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { Middleware } from '@lamware/core';
import lambdaFastify from 'aws-lambda-fastify';
import createFastify from 'fastify';
import { Config, SetupFunction, State } from './types';

export const fastify = (setup?: SetupFunction, config?: Config): Middleware<APIGatewayProxyHandlerV2<any>, State> => ({
    id: 'fastify',
    init: async (state) => {
        let app = config?.client ?? createFastify(config ?? {});

        if (setup) {
            app = await setup(app);
        }

        const handler = lambdaFastify(app);

        if (config?.attachState !== false) {
            app.decorateRequest('state', null);
            app.addHook('preHandler', async (request) => {
                // @ts-expect-error
                request.state = state();
            });
        }

        if (config?.enforceReady === true) {
            await app.ready();
        }

        return {
            fastify: app,
            fastifyHandler: async ({ event, context }) => handler(event, context),
        };
    },
});

export * from './types';
