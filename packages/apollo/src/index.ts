import type { Config as ApolloConfig, CreateHandlerOptions } from 'apollo-server-lambda';
import type { DestructuredHandler, Middleware } from '@lamware/core';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ApolloServer } from 'apollo-server-lambda';

export interface Config extends ApolloConfig {
    /**
     * Optionally provide an existing Apollo Server instance.
     */
    server?: ApolloServer;

    /**
     * Optionally provide options to the serverless handler.
     */
    handlerOptions?: CreateHandlerOptions;
}

export interface State {
    apollo: ApolloServer;
    apolloHandler: DestructuredHandler;
}

export const apollo = (config?: Config|ApolloServer): Middleware<APIGatewayProxyHandlerV2<any>, State> => ({
    id: 'apollo',
    pure: true,
    init: async () => {
        const localConfig = config instanceof ApolloServer ? {} : (config ?? {});
        const apollo = config instanceof ApolloServer ? config : (localConfig.server ?? new ApolloServer(localConfig));
        const handler = apollo.createHandler({ ...(localConfig.handlerOptions ?? {}) });

        return {
            apollo,
            apolloHandler: async ({ event, context, callback }) => handler(event, context, callback),
        };
    },
});
