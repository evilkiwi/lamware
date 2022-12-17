import type { ApolloServerOptions as ApolloConfig, BaseContext } from '@apollo/server';
import { startServerAndCreateLambdaHandler } from '@as-integrations/aws-lambda';
import type { LambdaHandlerOptions } from '@as-integrations/aws-lambda';
import type { DestructuredHandler, Middleware } from '@lamware/core';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ApolloServer } from '@apollo/server';

export type LamwareApolloConfig = {
  /**
   * Optionally provide an existing Apollo Server instance.
   */
  server?: ApolloServer;

  /**
   * Optionally provide options to the serverless handler.
   */
  handlerOptions?: LambdaHandlerOptions<BaseContext>;
}

export type Config = LamwareApolloConfig & ApolloConfig<BaseContext>;

export interface State {
  apollo: ApolloServer;
  apolloHandler: DestructuredHandler;
}

export type SetupFunction = (state: () => State) => Promise<ApolloServer>|ApolloServer;

export const apollo = (config?: Config|ApolloServer|SetupFunction): Middleware<APIGatewayProxyHandlerV2<any>, State> => ({
  id: 'apollo',
  init: async (state) => {
    let setup: SetupFunction|undefined;
    // @ts-expect-error
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

    // Create the Lambda handler.
    const handler = startServerAndCreateLambdaHandler(apollo, { ...(localConfig.handlerOptions ?? {}) });

    return {
      apollo,
      apolloHandler: async ({ event, context, callback }) => handler(event, context, callback),
    };
  },
});
