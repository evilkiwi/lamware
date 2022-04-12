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

export type SetupFunction = (state: () => State) => Promise<ApolloServer>|ApolloServer;

export const apollo = (config?: Config|ApolloServer|SetupFunction): Middleware<APIGatewayProxyHandlerV2<any>, State> => ({
    id: 'apollo',
    init: async (state) => {
        let setup: SetupFunction|undefined;
        let localConfig: Config = {};
        let apollo!: ApolloServer;

        // Parse the argument.
        if (config instanceof ApolloServer) {
            apollo = config;
        } else if (typeof config === 'function') {
            setup = config;
        } else if (config) {
            localConfig = config;

            if (localConfig.server) {
                apollo = localConfig.server;
            }
        }

        // Create the Apollo Server, if one wasn't provided.
        if (!apollo) {
            if (setup) {
                apollo = await setup(state);
            } else {
                apollo = new ApolloServer(localConfig);
            }
        }

        // Create the `apollo-server-lambda` handler.
        const handler = apollo.createHandler({ ...(localConfig.handlerOptions ?? {}) });

        return {
            apollo,
            apolloHandler: async ({ event, context, callback }) => handler(event, context, callback),
        };
    },
});
