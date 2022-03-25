import type { Middleware } from '@lamware/core';
import type { Handler } from 'aws-lambda';
import http from 'http';

export interface Options {
    url?: string;
    app: string;
    env: string;
    config: string;
}

export const appconfig = <Config = any>({ url, app, env, config }: Options): Middleware<Handler, { config: Config }> => {
    return {
        id: 'appconfig',
        pure: true,
        init: async () => {
            try {
                const res = await new Promise<http.IncomingMessage>(resolve => {
                    http.get(`${url ?? 'http://localhost:2772'}/applications/${app}/environments/${env}/configurations/${config}`, message => resolve(message));
                });

                const data = await new Promise<string>((resolve, reject) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('error', err => reject(err));
                    res.on('end', () => resolve(data));
                });

                return { config: JSON.parse(data) };
            } catch (e) {
                throw new Error(`failed to load appconfig: ${e}`);
            }
        },
    };
};
