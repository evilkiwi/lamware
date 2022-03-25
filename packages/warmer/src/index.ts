import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import type { Middleware } from '@lamware/core';
import type { WarmerConfig } from 'lambda-warmer';
import lambdaWarmer from 'lambda-warmer';

export const warmer = (config?: typeof WarmerConfig): Middleware<APIGatewayProxyHandlerV2, { is_warmed: boolean }> => ({
    id: 'warmer',
    pure: true,
    before: async (payload) => {
        payload.state.is_warmed = false;

        try {
            if (await lambdaWarmer(payload.event, config)) {
                payload.state.is_warmed = true;
                payload.response = 'warmed';
            }
        } catch {}

        return payload;
    },
});
