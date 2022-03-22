import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { Middleware } from '@tnotifier/lamware';
import type { WarmerConfig } from 'lambda-warmer';
import lambdaWarmer from 'lambda-warmer';

declare module 'aws-lambda' {
    interface Context {
        is_warmed: boolean;
    }
}

export const warmer = (config?: typeof WarmerConfig): Middleware<APIGatewayProxyHandlerV2> => ({
    id: 'warmer',
    pure: true,
    before: async (payload) => {
        payload.context.is_warmed = false;

        if (await lambdaWarmer(payload.event, config)) {
            payload.context.is_warmed = true;
            payload.response = 'warmed';
        }

        return payload;
    },
});
